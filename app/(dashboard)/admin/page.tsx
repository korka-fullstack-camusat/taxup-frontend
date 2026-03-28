'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ArrowLeftRight, ShieldAlert, DollarSign, TrendingUp, Activity,
  Receipt, ClipboardList, BarChart3, Building2, Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel } from '@/lib/export';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

interface AdminSummary {
  users: { total: number; active: number; by_role: Record<string, number> };
  transactions: { total_transactions: number; today_transactions: number; month_volume: number; pending_transactions: number };
  fraud: { total_alerts: number; confirmed_fraud: number; pending_alerts: number; by_type: Record<string, number> };
  audits: { total: number; open: number; in_progress: number; completed: number };
  fiscal: { total_receipts: number; month_tax_collected_xof: number; total_tax_collected_xof: number; total_volume_xof: number };
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  fraud_alerts: number;
  tax_collected: number;
  new_users: number;
  receipts: number;
}

interface RealtimeData {
  by_type: { type: string; count: number; volume: number }[];
  by_status: { status: string; count: number }[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyens', OPERATEUR_MOBILE: 'Op\u00e9rateurs',
  AUDITEUR_FISCAL: 'Auditeurs', AGENT_DGID: 'Agents DGID', ADMIN: 'Admins',
};
const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'D\u00e9p\u00f4t',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Mobile', TRANSFERT: 'Transfert',
  PAIEMENT: 'Paiement', RETRAIT: 'Retrait', DEPOT: 'D\u00e9p\u00f4t', REMBOURSEMENT: 'Remb.',
};
const statusColors: Record<string, string> = {
  COMPLETED: '#10b981', PENDING: '#f59e0b', FAILED: '#ef4444',
  CANCELLED: '#6b7280', UNDER_REVIEW: '#f97316',
};

type Section = 'all' | 'transactions' | 'fraud' | 'fiscal' | 'users' | 'audits';

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Vue g\u00e9n\u00e9rale', icon: BarChart3 },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'fraud', label: 'Fraude', icon: ShieldAlert },
  { id: 'fiscal', label: 'Revenus & TVA', icon: DollarSign },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'audits', label: 'Audits', icon: ClipboardList },
];

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('fr-FR');
}

function fmtShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('all');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') fetchData();
  }, [user, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, eRes, rRes] = await Promise.allSettled([
        api.get('/dashboard/admin-summary'),
        api.get(`/dashboard/evolution?days=${period}`),
        api.get('/dashboard/realtime'),
      ]);
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data);
      if (eRes.status === 'fulfilled') setEvolution(eRes.value.data.evolution || []);
      if (rRes.status === 'fulfilled') setRealtime(rRes.value.data);
    } finally { setLoading(false); }
  };

  const handleExportEvolution = (format: 'csv' | 'excel') => {
    const cols = [
      { key: 'date', label: 'Date' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'volume', label: 'Volume (XOF)' },
      { key: 'tax_collected', label: 'TVA Collect\u00e9e' },
      { key: 'fraud_alerts', label: 'Alertes Fraude' },
      { key: 'new_users', label: 'Nouveaux Utilisateurs' },
    ];
    const fn = format === 'csv' ? exportCSV : exportExcel;
    fn(evolution as unknown as Record<string, unknown>[], `taxup-evolution-${period}j`, cols);
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  const roleData = summary ? Object.entries(summary.users.by_role).map(([role, count], i) => ({
    name: roleLabel[role] || role, value: count, color: COLORS[i % COLORS.length],
  })) : [];

  const byTypeData = realtime?.by_type.map((d, i) => ({
    name: typeLabel[d.type] || d.type, transactions: d.count, volume: Math.round(d.volume / 1000),
    color: COLORS[i % COLORS.length],
  })) || [];

  const byStatusData = realtime?.by_status.map(d => ({
    name: d.status, value: d.count, color: statusColors[d.status] || '#6b7280',
  })) || [];

  const fraudByType = summary ? Object.entries(summary.fraud.by_type).map(([type, count], i) => ({
    name: type, value: count, color: COLORS[i % COLORS.length],
  })) : [];

  const show = (s: Section) => section === 'all' || section === s;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue centralis\u00e9e de toutes les donn\u00e9es TAXUP</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <div className="relative group">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download className="h-4 w-4" /> Exporter
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-20 min-w-[140px]">
              <button onClick={() => handleExportEvolution('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export CSV</button>
              <button onClick={() => handleExportEvolution('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export Excel</button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards - always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {show('users') && (
              <KPI icon={Users} bg="bg-blue-50" color="text-blue-600" label="Utilisateurs"
                value={summary?.users.total ?? 0} sub={`${summary?.users.active ?? 0} actifs`} />
            )}
            {show('transactions') && (
              <KPI icon={ArrowLeftRight} bg="bg-green-50" color="text-green-600" label="Transactions"
                value={summary?.transactions.total_transactions ?? 0} sub={`${summary?.transactions.today_transactions ?? 0} aujourd'hui`} />
            )}
            {show('fraud') && (
              <KPI icon={ShieldAlert} bg="bg-red-50" color="text-red-600" label="Alertes Fraude"
                value={summary?.fraud.total_alerts ?? 0} sub={`${summary?.fraud.pending_alerts ?? 0} en attente`} />
            )}
            {show('fiscal') && (
              <KPI icon={DollarSign} bg="bg-purple-50" color="text-purple-600" label="TVA ce mois"
                value={`${formatXOF(summary?.fiscal.month_tax_collected_xof ?? 0)} XOF`}
                sub={`${summary?.fiscal.total_receipts ?? 0} re\u00e7us`} />
            )}
            {show('audits') && (
              <KPI icon={ClipboardList} bg="bg-yellow-50" color="text-yellow-600" label="Audits"
                value={summary?.audits.total ?? 0} sub={`${summary?.audits.open ?? 0} ouverts`} />
            )}
            {show('transactions') && (
              <KPI icon={Activity} bg="bg-orange-50" color="text-orange-600" label="Volume ce mois"
                value={`${formatXOF(summary?.transactions.month_volume ?? 0)} XOF`}
                sub={`${summary?.transactions.pending_transactions ?? 0} en attente`} />
            )}
            {show('fiscal') && (
              <KPI icon={Receipt} bg="bg-teal-50" color="text-teal-600" label="TVA totale"
                value={`${formatXOF(summary?.fiscal.total_tax_collected_xof ?? 0)} XOF`}
                sub="Cumul\u00e9" />
            )}
            {show('fiscal') && (
              <KPI icon={TrendingUp} bg="bg-indigo-50" color="text-indigo-600" label="Volume total"
                value={`${formatXOF(summary?.fiscal.total_volume_xof ?? 0)} XOF`}
                sub="Toutes p\u00e9riodes" />
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Evolution Transactions */}
            {show('transactions') && (
              <ChartCard title="\u00c9volution des transactions" icon={Activity}>
                {evolution.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="transactions" stroke="#2563eb" fill="#2563eb20" name="Transactions" />
                      <Area type="monotone" dataKey="receipts" stroke="#10b981" fill="#10b98120" name="Re\u00e7us" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Transactions par type (24h) */}
            {show('transactions') && byTypeData.length > 0 && (
              <ChartCard title="Transactions par type (24h)" icon={BarChart3}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Transactions" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Statut distribution */}
            {show('transactions') && byStatusData.length > 0 && (
              <ChartCard title="R\u00e9partition par statut (24h)" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {byStatusData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Revenue Evolution */}
            {show('fiscal') && (
              <ChartCard title="\u00c9volution revenus & TVA" icon={DollarSign}>
                {evolution.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${formatXOF(Number(value))} XOF`} />
                      <Legend />
                      <Bar dataKey="volume" fill="#2563eb" radius={[4, 4, 0, 0]} name="Volume" />
                      <Bar dataKey="tax_collected" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="TVA" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* TVA Daily */}
            {show('fiscal') && (
              <ChartCard title="Collecte TVA quotidienne" icon={Receipt}>
                {evolution.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => `${formatXOF(Number(value))} XOF`} />
                      <Area type="monotone" dataKey="tax_collected" stroke="#8b5cf6" fill="#8b5cf630" name="TVA" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Fraud Alerts Evolution */}
            {show('fraud') && (
              <ChartCard title="\u00c9volution alertes fraude" icon={ShieldAlert}>
                {evolution.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="fraud_alerts" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Alertes" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Fraud by Type */}
            {show('fraud') && fraudByType.length > 0 && (
              <ChartCard title="Fraude par type" icon={ShieldAlert}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={fraudByType} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" nameKey="name">
                      {fraudByType.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Users by Role */}
            {show('users') && roleData.length > 0 && (
              <ChartCard title="Utilisateurs par r\u00f4le" icon={Users}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {roleData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* New Users Evolution */}
            {show('users') && (
              <ChartCard title="\u00c9volution nouveaux utilisateurs" icon={Users}>
                {evolution.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="new_users" fill="#10b981" radius={[4, 4, 0, 0]} name="Nouveaux" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            )}

            {/* Audits stats */}
            {show('audits') && summary && (
              <ChartCard title="R\u00e9partition des audits" icon={ClipboardList}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ouverts', value: summary.audits.open, color: '#f59e0b' },
                        { name: 'En cours', value: summary.audits.in_progress, color: '#2563eb' },
                        { name: 'Termin\u00e9s', value: summary.audits.completed, color: '#10b981' },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" nameKey="name">
                      {[
                        { name: 'Ouverts', value: summary.audits.open, color: '#f59e0b' },
                        { name: 'En cours', value: summary.audits.in_progress, color: '#2563eb' },
                        { name: 'Termin\u00e9s', value: summary.audits.completed, color: '#10b981' },
                      ].filter(d => d.value > 0).map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

          </div>
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, bg, color, label, value, sub }: {
  icon: React.ElementType; bg: string; color: string; label: string; value: number | string; sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e disponible</div>;
}
