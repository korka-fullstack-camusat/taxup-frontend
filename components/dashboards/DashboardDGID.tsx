'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowLeftRight, 
  AlertTriangle, 
  ClipboardList, 
  Receipt, 
  TrendingUp, 
  Shield, 
  Activity, 
  DollarSign,
  RefreshCw,
  ChevronRight,
  Building2,
  Users,
  Map,
  FileText,
  BarChart3,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV } from '@/lib/export';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';

interface OverviewData {
  transactions: { total: number; pending: number; completed: number; failed: number; total_volume: number };
  fraud: { total_alerts: number; pending_alerts: number; high_risk: number };
  audits: { total: number; open: number; in_progress: number; completed: number };
  fiscal: { total_receipts: number; month_tax_collected_xof: number };
}

interface RealtimeData {
  by_type: { type: string; count: number; volume: number }[];
  by_status: { status: string; count: number }[];
  recent_fraud_alerts: { id: string; fraud_type: string; risk_score: number; detected_at: string }[];
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  fraud_alerts: number;
  tax_collected: number;
}

const TYPE_COLORS = ['#00853F', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981', PENDING: '#f59e0b', FAILED: '#ef4444', FLAGGED: '#f97316',
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Depot',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
};

const fraudTypeLabel: Record<string, string> = {
  STRUCTURING: 'Fragmentation', 
  RAPID_TRANSFER: 'Transfert rapide',
  UNUSUAL_PATTERN: 'Schema inhabituel', 
  SUSPICIOUS_AMOUNT: 'Montant suspect',
  VELOCITY_ABUSE: 'Abus frequence',
};

function formatXOF(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B XOF`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XOF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XOF`;
  return `${n} XOF`;
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function DashboardDGID() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/realtime'),
      api.get(`/dashboard/evolution?days=${period}`),
    ])
      .then(([ov, rt, ev]) => {
        setOverview(ov.data);
        setRealtime(rt.data);
        setEvolution(ev.data.evolution || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [period]);

  const handleExport = () => {
    if (evolution.length === 0) return;
    const cols = [
      { key: 'date', label: 'Date' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'volume', label: 'Volume (XOF)' },
      { key: 'tax_collected', label: 'TVA Collectee' },
      { key: 'fraud_alerts', label: 'Alertes Fraude' },
    ];
    exportCSV(evolution as unknown as Record<string, unknown>[], `taxup-dgid-${period}j`, cols);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  // Chart data
  const byTypeData = realtime?.by_type.map((d, i) => ({
    name: typeLabel[d.type] || d.type,
    transactions: d.count,
    volume: Math.round(d.volume / 1000),
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  })) || [];

  const byStatusData = realtime?.by_status.map(d => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || '#6b7280',
  })) || [];

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord DGID</h1>
            <p className="text-gray-500 text-sm mt-1">Bienvenue, {user?.full_name || 'Agent DGID'}</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={period} 
              onChange={e => setPeriod(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
            <button
              onClick={handleExport}
              disabled={evolution.length === 0}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-700/20"
            >
              <Download className="h-4 w-4" /> Exporter
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={ArrowLeftRight} 
            label="Total transactions" 
            value={overview?.transactions.total ?? 0}
            subtitle={formatXOF(overview?.transactions.total_volume ?? 0)}
            gradient="from-green-600 to-green-700"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Alertes fraude" 
            value={overview?.fraud.total_alerts ?? 0}
            subtitle={`${overview?.fraud.pending_alerts ?? 0} en attente`}
            gradient="from-red-500 to-red-600"
          />
          <StatCard 
            icon={ClipboardList} 
            label="Audits actifs" 
            value={(overview?.audits.open ?? 0) + (overview?.audits.in_progress ?? 0)}
            subtitle={`${overview?.audits.completed ?? 0} termines`}
            gradient="from-purple-500 to-purple-600"
          />
          <StatCard 
            icon={DollarSign} 
            label="TVA ce mois" 
            value={formatShort(overview?.fiscal.month_tax_collected_xof ?? 0)}
            subtitle={`${overview?.fiscal.total_receipts ?? 0} recus`}
            gradient="from-emerald-500 to-emerald-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolution Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-700" />
              Evolution des transactions ({period}j)
            </h3>
            {evolution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="transactions" stroke="#00853F" fill="#00853F20" name="Transactions" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Evolution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Evolution TVA ({period}j)
            </h3>
            {evolution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatXOF(Number(value))} />
                  <Area type="monotone" dataKey="tax_collected" stroke="#10b981" fill="#10b98120" name="TVA Collectee" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar chart transactions par type */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-700" />
              Transactions 24h par type
            </h3>
            {byTypeData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#00853F" radius={[4, 4, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart par statut */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              Repartition par statut (24h)
            </h3>
            {byStatusData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={byStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={3}>
                      {byStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color || TYPE_COLORS[i % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {byStatusData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Fraud Alerts Evolution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Alertes fraude ({period}j)
            </h3>
            {evolution.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fraud_alerts" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Alertes" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Fraud Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Alertes fraude recentes (24h)</h2>
            </div>
            <a href="/fraud" className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
              Voir tout <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          {!realtime?.recent_fraud_alerts.length ? (
            <div className="text-center py-12 text-gray-400">
              <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune alerte recente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type de fraude</th>
                    <th className="px-6 py-3 text-center">Score de risque</th>
                    <th className="px-6 py-3 text-left">Detecte le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {realtime.recent_fraud_alerts.slice(0, 8).map(alert => {
                    const risk = alert.risk_score;
                    const riskClass = risk >= 0.8 ? 'text-red-600 bg-red-50' : risk >= 0.6 ? 'text-orange-600 bg-orange-50' : risk >= 0.4 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
                    return (
                      <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${risk >= 0.7 ? 'text-red-500' : 'text-orange-500'}`} />
                            <span className="font-medium text-gray-800">{fraudTypeLabel[alert.fraud_type] || alert.fraud_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${risk >= 0.8 ? 'bg-red-500' : risk >= 0.6 ? 'bg-orange-500' : risk >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${risk * 100}%` }} 
                              />
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskClass}`}>
                              {Math.round(risk * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(alert.detected_at).toLocaleString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions', color: 'blue' },
            { href: '/fraud', icon: AlertTriangle, label: 'Fraude', color: 'red' },
            { href: '/audits', icon: ClipboardList, label: 'Audits', color: 'purple' },
            { href: '/receipts', icon: Receipt, label: 'Recus', color: 'emerald' },
            { href: '/admin/operateurs', icon: Building2, label: 'Operateurs', color: 'amber' },
            { href: '/admin/carte-fiscale', icon: Map, label: 'Carte', color: 'cyan' },
          ].map(({ href, icon: Icon, label, color }) => (
            <a 
              key={href} 
              href={href} 
              className={`group rounded-2xl p-4 flex flex-col items-center gap-2 border transition-all hover:shadow-lg bg-${color}-50 border-${color}-100 hover:bg-${color}-100`}
            >
              <div className={`bg-${color}-100 p-3 rounded-xl group-hover:bg-${color}-600 transition-colors`}>
                <Icon className={`h-5 w-5 text-${color}-600 group-hover:text-white transition-colors`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  gradient 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
    </div>
  );
}
