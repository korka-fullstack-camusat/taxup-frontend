'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, ArrowLeftRight, ShieldAlert, ClipboardList, Settings,
  TrendingUp, UserCheck, UserX, DollarSign, Receipt, Activity,
  BarChart3, AlertTriangle, Shield, FileText, ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
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
  recent_fraud_alerts: { id: string; transaction_id: string; fraud_type: string; risk_score: number; detected_at: string }[];
}

interface FiscalReport {
  period: string;
  receipt_count: number;
  total_tax_xof: number;
  total_volume_xof: number;
}

const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyens', OPERATEUR_MOBILE: 'Opérateurs', AUDITEUR_FISCAL: 'Auditeurs',
  AGENT_DGID: 'Agents DGID', ADMIN: 'Admins',
};

const roleColor: Record<string, string> = {
  CITOYEN: 'bg-blue-100 text-blue-700', OPERATEUR_MOBILE: 'bg-purple-100 text-purple-700',
  AUDITEUR_FISCAL: 'bg-amber-100 text-amber-700', AGENT_DGID: 'bg-sky-100 text-sky-700',
  ADMIN: 'bg-red-100 text-red-700',
};

const typeLabel: Record<string, string> = {
  TRANSFERT: 'Transfert', PAIEMENT: 'Paiement', RETRAIT: 'Retrait',
  DEPOT: 'Dépôt', REMBOURSEMENT: 'Remboursement',
};

const fraudTypeLabel: Record<string, string> = {
  VELOCITY: 'Fréquence élevée', LARGE_AMOUNT: 'Montant suspect',
  ROUND_TRIPPING: 'Aller-retour', STRUCTURING: 'Fragmentation',
  UNUSUAL_PATTERN: 'Schéma inhabituel', BLACKLISTED: 'Liste noire',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16a34a', PENDING: '#d97706', FAILED: '#dc2626',
  CANCELLED: '#6b7280', UNDER_REVIEW: '#2563eb',
};
const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626', '#6b7280', '#2563eb'];
const statusLabel: Record<string, string> = {
  COMPLETED: 'Complété', PENDING: 'En attente', FAILED: 'Échoué',
  CANCELLED: 'Annulé', UNDER_REVIEW: 'En révision',
};

function formatXOF(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Mrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return n.toLocaleString('fr-FR');
}

function formatFullXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [fiscalReports, setFiscalReports] = useState<FiscalReport[]>([]);
  const [userStats, setUserStats] = useState<{ total: number; active: number; inactive: number; byRole: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, rtRes, frRes, usRes] = await Promise.allSettled([
        api.get('/dashboard/overview'),
        api.get('/dashboard/realtime'),
        api.get('/dashboard/fiscal-reports'),
        api.get('/users?page_size=1000'),
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data);
      if (rtRes.status === 'fulfilled') setRealtime(rtRes.value.data);
      if (frRes.status === 'fulfilled') setFiscalReports(frRes.value.data.fiscal_reports || []);

      if (usRes.status === 'fulfilled') {
        const users: { role: string; is_active: boolean }[] = usRes.value.data.items || usRes.value.data || [];
        const byRole = users.reduce((acc: Record<string, number>, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
        setUserStats({
          total: users.length,
          active: users.filter(u => u.is_active).length,
          inactive: users.filter(u => !u.is_active).length,
          byRole,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  // Chart data
  const byTypeData = realtime?.by_type.map(d => ({
    name: typeLabel[d.type] || d.type,
    transactions: d.count,
    volume: Math.round(d.volume / 1000),
  })) || [];

  const byStatusData = realtime?.by_status.map((d, i) => ({
    name: statusLabel[d.status] || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || PIE_COLORS[i % PIE_COLORS.length],
  })) || [];

  const fiscalChartData = fiscalReports.slice(0, 12).reverse().map(r => ({
    period: r.period,
    taxes: Math.round(r.total_tax_xof / 1000),
    volume: Math.round(r.total_volume_xof / 1000),
    reçus: r.receipt_count,
  }));

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de la plateforme TAXUP — Données en temps réel</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Dernière mise à jour</p>
          <p className="text-sm font-medium text-gray-600">{new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* ═══════════ KPI Cards ═══════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={ArrowLeftRight} label="Total transactions" value={overview?.transactions.total ?? 0}
              sub={`Volume: ${formatXOF(overview?.transactions.total_volume ?? 0)} XOF`} color="blue" trend="+12%" />
            <KPICard icon={DollarSign} label="Taxes collectées (mois)" value={`${formatXOF(overview?.fiscal.month_tax_collected_xof ?? 0)} XOF`}
              sub={`${overview?.fiscal.total_receipts ?? 0} reçus fiscaux`} color="green" trend="+8%" />
            <KPICard icon={ShieldAlert} label="Alertes fraude" value={overview?.fraud.total_alerts ?? 0}
              sub={`${overview?.fraud.pending_alerts ?? 0} en attente · ${overview?.fraud.high_risk ?? 0} critique(s)`} color="red" />
            <KPICard icon={ClipboardList} label="Audits actifs" value={(overview?.audits.open ?? 0) + (overview?.audits.in_progress ?? 0)}
              sub={`${overview?.audits.total ?? 0} au total · ${overview?.audits.completed ?? 0} terminés`} color="purple" />
          </div>

          {/* ═══════════ User stats row ═══════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{userStats?.total ?? 0}</p>
                <p className="text-xs text-gray-500">Utilisateurs total</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50"><UserCheck className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{userStats?.active ?? 0}</p>
                <p className="text-xs text-gray-500">Actifs</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-50"><UserX className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold text-red-600">{userStats?.inactive ?? 0}</p>
                <p className="text-xs text-gray-500">Inactifs</p>
              </div>
            </div>
          </div>

          {/* ═══════════ Charts Row 1: Transactions 24h ═══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart — par type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Transactions dernières 24h — par type
              </h2>
              <p className="text-xs text-gray-400 mb-4">Nombre de transactions par catégorie</p>
              {byTypeData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number, name: string) => [value, name === 'transactions' ? 'Nb transactions' : 'Volume (K XOF)']} />
                    <Bar dataKey="transactions" fill="#2563eb" radius={[6, 6, 0, 0]} name="Nb transactions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart — par statut */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Répartition par statut (24h)
              </h2>
              <p className="text-xs text-gray-400 mb-4">Distribution des transactions par état</p>
              {byStatusData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3}>
                      {byStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ═══════════ Chart Row 2: Évolution fiscale ═══════════ */}
          {fiscalChartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                Évolution des revenus fiscaux par période
              </h2>
              <p className="text-xs text-gray-400 mb-4">Taxes collectées et volume total par période fiscale (en milliers XOF)</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={fiscalChartData}>
                  <defs>
                    <linearGradient id="colorTaxes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number, name: string) => [`${value} K XOF`, name === 'taxes' ? 'Taxes collectées' : 'Volume total']} />
                  <Legend formatter={(value) => <span className="text-xs text-gray-600">{value === 'taxes' ? 'Taxes collectées' : 'Volume total'}</span>} />
                  <Area type="monotone" dataKey="volume" stroke="#2563eb" fill="url(#colorVolume)" strokeWidth={2} name="volume" />
                  <Area type="monotone" dataKey="taxes" stroke="#16a34a" fill="url(#colorTaxes)" strokeWidth={2} name="taxes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ═══════════ Rapports fiscaux — tableau ═══════════ */}
          {fiscalReports.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Rapports fiscaux par période
                </h2>
                <Link href="/receipts" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  Voir les reçus <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Période</th>
                      <th className="px-6 py-3 text-right">Nb reçus</th>
                      <th className="px-6 py-3 text-right">Total taxes (XOF)</th>
                      <th className="px-6 py-3 text-right">Volume total (XOF)</th>
                      <th className="px-6 py-3 text-right">Taux effectif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fiscalReports.slice(0, 10).map(r => (
                      <tr key={r.period} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-800">{r.period}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{r.receipt_count}</td>
                        <td className="px-6 py-3 text-right font-semibold text-green-700">{formatFullXOF(r.total_tax_xof)}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{formatFullXOF(r.total_volume_xof)}</td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                            {r.total_volume_xof > 0 ? ((r.total_tax_xof / r.total_volume_xof) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ Alertes fraude récentes ═══════════ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Alertes fraude récentes (24h)
              </h2>
              <Link href="/fraud" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {!realtime?.recent_fraud_alerts?.length ? (
              <div className="text-center py-10 text-gray-400">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte récente — le système est sain</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-center">Score de risque</th>
                      <th className="px-6 py-3 text-left">ID Transaction</th>
                      <th className="px-6 py-3 text-left">Détecté le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {realtime.recent_fraud_alerts.map(alert => {
                      const rc = alert.risk_score >= 0.8 ? 'text-red-600 bg-red-50' : alert.risk_score >= 0.5 ? 'text-orange-600 bg-orange-50' : 'text-yellow-600 bg-yellow-50';
                      return (
                        <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-3.5 w-3.5 ${alert.risk_score >= 0.7 ? 'text-red-500' : 'text-orange-400'}`} />
                              <span className="font-medium text-gray-800">{fraudTypeLabel[alert.fraud_type] || alert.fraud_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rc}`}>
                              {Math.round(alert.risk_score * 100)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-gray-500 truncate max-w-[140px]">{alert.transaction_id}</td>
                          <td className="px-6 py-3 text-gray-400 text-xs">{new Date(alert.detected_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ═══════════ Répartition par rôle ═══════════ */}
          {userStats && Object.keys(userStats.byRole).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Répartition des utilisateurs par rôle
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(userStats.byRole).map(([role, count]) => (
                  <div key={role} className={`px-4 py-2 rounded-full text-sm font-medium ${roleColor[role] || 'bg-gray-100 text-gray-700'}`}>
                    {roleLabel[role] || role}: <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ Actions rapides ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction href="/admin/users" icon={Users} title="Gestion des utilisateurs"
          desc="Créer, modifier, désactiver des comptes" color="blue" />
        <QuickAction href="/transactions" icon={ArrowLeftRight} title="Toutes les transactions"
          desc="Consulter et filtrer les transactions" color="indigo" />
        <QuickAction href="/fraud" icon={ShieldAlert} title="Alertes fraude"
          desc="Gérer les alertes de fraude détectées" color="red" />
        <QuickAction href="/audits" icon={ClipboardList} title="Audits fiscaux"
          desc="Suivre et gérer les audits" color="amber" />
        <QuickAction href="/receipts" icon={Receipt} title="Reçus fiscaux"
          desc="Consulter les reçus fiscaux émis" color="green" />
        <QuickAction href="/admin/settings" icon={Settings} title="Paramètres"
          desc="Configurer la plateforme" color="gray" />
      </div>
    </div>
  );
}

/* ═══════════ Sub-components ═══════════ */

function KPICard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string; trend?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-5 flex items-start justify-between`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${c.bg}`}><Icon className={`h-5 w-5 ${c.icon}`} /></div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {trend && (
        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-0.5">
          <ArrowUpRight className="h-3 w-3" />{trend}
        </span>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, desc, color }: {
  href: string; icon: React.ElementType; title: string; desc: string; color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    gray: 'bg-gray-50 text-gray-600 group-hover:bg-gray-100',
  };
  return (
    <Link href={href} className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex items-start gap-4">
      <div className={`p-3 rounded-xl transition-colors ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
    </Link>
  );
}
