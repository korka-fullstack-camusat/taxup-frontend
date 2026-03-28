'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, ArrowLeftRight, ShieldAlert, ClipboardList, Settings, TrendingUp,
  UserCheck, DollarSign, Receipt, Activity, AlertTriangle, BarChart3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AdminSummary {
  users: { total: number; active: number; by_role: Record<string, number> };
  transactions: { total_transactions: number; today_transactions: number; month_volume: number; pending_transactions: number };
  fraud: { total_alerts: number; confirmed_fraud: number; pending_alerts: number; by_type: Record<string, number> };
  audits: { total: number; open: number; in_progress: number; completed: number; by_anomaly_type?: Record<string, number> };
  fiscal: { total_receipts: number; month_tax_collected_xof: number; total_tax_collected_xof: number; total_volume_xof: number };
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  fraud_alerts: number;
  tax_collected: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyens', OPERATEUR_MOBILE: 'Op\u00e9rateurs',
  AUDITEUR_FISCAL: 'Auditeurs', AGENT_DGID: 'Agents DGID', ADMIN: 'Admins',
};

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('fr-FR');
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [summaryRes, evoRes] = await Promise.allSettled([
        api.get('/dashboard/admin-summary'),
        api.get('/dashboard/evolution?days=14'),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (evoRes.status === 'fulfilled') setEvolution(evoRes.value.data.evolution || []);
    } finally { setLoading(false); }
  };

  if (!user || user.role !== 'ADMIN') return null;

  const roleData = summary ? Object.entries(summary.users.by_role).map(([role, count], i) => ({
    name: roleLabel[role] || role, value: count, color: COLORS[i % COLORS.length],
  })) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de la plateforme TAXUP</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600"
              label="Utilisateurs" value={summary?.users.total ?? 0}
              subtitle={`${summary?.users.active ?? 0} actifs`} />
            <KPICard icon={ArrowLeftRight} iconBg="bg-emerald-50" iconColor="text-emerald-600"
              label="Transactions" value={summary?.transactions.total_transactions ?? 0}
              subtitle={`${summary?.transactions.today_transactions ?? 0} aujourd'hui`} />
            <KPICard icon={ShieldAlert} iconBg="bg-red-50" iconColor="text-red-600"
              label="Alertes Fraude" value={summary?.fraud.total_alerts ?? 0}
              subtitle={`${summary?.fraud.pending_alerts ?? 0} en attente`} />
            <KPICard icon={DollarSign} iconBg="bg-purple-50" iconColor="text-purple-600"
              label="TVA ce mois" value={`${formatXOF(summary?.fiscal.month_tax_collected_xof ?? 0)} XOF`}
              subtitle={`${summary?.fiscal.total_receipts ?? 0} re\u00e7us`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Evolution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                \u00c9volution des transactions (14 jours)
              </h2>
              {evolution.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="transactions" stroke="#10b981" fill="#10b98130" name="Transactions" />
                    <Area type="monotone" dataKey="fraud_alerts" stroke="#ef4444" fill="#ef444420" name="Alertes" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Role Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                R\u00e9partition par r\u00f4le
              </h2>
              {roleData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {roleData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue Evolution */}
          {evolution.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                \u00c9volution des revenus fiscaux
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={formatXOF} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `${formatXOF(Number(value))} XOF`} />
                  <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} name="Volume" />
                  <Bar dataKey="tax_collected" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="TVA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: '/admin/acces', icon: Users, title: 'Gestion des acc\u00e8s', desc: 'G\u00e9rer les utilisateurs et permissions', color: 'emerald' },
              { href: '/admin/revenus', icon: TrendingUp, title: 'Analyse revenus', desc: 'Suivre les revenus fiscaux', color: 'blue' },
              { href: '/admin/operateurs', icon: BarChart3, title: 'Op\u00e9rateurs', desc: 'G\u00e9rer les op\u00e9rateurs mobile money', color: 'purple' },
              { href: '/admin/rapports', icon: Receipt, title: 'Rapports', desc: 'G\u00e9n\u00e9rer des rapports fiscaux', color: 'orange' },
              { href: '/admin/carte-fiscale', icon: Activity, title: 'Carte Fiscale', desc: 'Visualisation g\u00e9ographique', color: 'teal' },
              { href: '/admin/parametres', icon: Settings, title: 'Param\u00e8tres', desc: 'Configurer la plateforme', color: 'gray' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-${item.color === 'emerald' ? 'emerald' : item.color === 'blue' ? 'blue' : item.color === 'purple' ? 'purple' : item.color === 'orange' ? 'orange' : item.color === 'teal' ? 'teal' : 'gray'}-50`}>
                  <item.icon className={`h-5 w-5 text-${item.color === 'emerald' ? 'emerald' : item.color === 'blue' ? 'blue' : item.color === 'purple' ? 'purple' : item.color === 'orange' ? 'orange' : item.color === 'teal' ? 'teal' : 'gray'}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, iconBg, iconColor, label, value, subtitle }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: number | string; subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
