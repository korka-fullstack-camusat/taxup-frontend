'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, AlertTriangle, ClipboardList, Receipt, TrendingUp, Shield, Activity, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

const TYPE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16a34a', PENDING: '#d97706', FAILED: '#dc2626', FLAGGED: '#ea580c',
};
const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
};

function formatXOF(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M XOF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K XOF`;
  return `${n} XOF`;
}

export default function DashboardDGID() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/realtime'),
    ])
      .then(([ov, rt]) => {
        setOverview(ov.data);
        setRealtime(rt.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Tableau de bord DGID" subtitle="Supervision globale de la plateforme" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const byTypeData = realtime?.by_type.map(d => ({
    name: typeLabel[d.type] || d.type,
    transactions: d.count,
    volume: Math.round(d.volume / 1000),
  })) || [];

  const byStatusData = realtime?.by_status.map(d => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || '#6b7280',
  })) || [];

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Tableau de bord DGID" subtitle="Supervision globale — toutes les activités" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total transactions"
            value={overview?.transactions.total ?? 0}
            subtitle={`Vol: ${formatXOF(overview?.transactions.total_volume ?? 0)}`}
            icon={ArrowLeftRight} color="blue"
          />
          <StatCard
            title="Alertes fraude"
            value={overview?.fraud.total_alerts ?? 0}
            subtitle={`${overview?.fraud.pending_alerts ?? 0} en attente`}
            icon={AlertTriangle} color="red"
          />
          <StatCard
            title="Audits actifs"
            value={(overview?.audits.open ?? 0) + (overview?.audits.in_progress ?? 0)}
            subtitle={`${overview?.audits.completed ?? 0} terminés`}
            icon={ClipboardList} color="purple"
          />
          <StatCard
            title="Taxes ce mois"
            value={formatXOF(overview?.fiscal.month_tax_collected_xof ?? 0)}
            subtitle={`${overview?.fiscal.total_receipts ?? 0} reçus`}
            icon={DollarSign} color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart transactions par type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Transactions 24h par type
            </h2>
            {byTypeData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#16a34a" radius={[4, 4, 0, 0]} name="Nb transactions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart par statut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Répartition par statut (24h)
            </h2>
            {byStatusData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {byStatusData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color || TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alertes fraude récentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Alertes fraude récentes (24h)
            </h2>
            <a href="/fraud" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout →</a>
          </div>
          {!realtime?.recent_fraud_alerts.length ? (
            <div className="text-center py-10 text-gray-400">
              <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune alerte récente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type de fraude</th>
                    <th className="px-6 py-3 text-center">Score de risque</th>
                    <th className="px-6 py-3 text-left">Détecté le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {realtime.recent_fraud_alerts.map(alert => {
                    const risk = alert.risk_score;
                    const riskClass = risk >= 0.8 ? 'text-red-600 bg-red-50' : risk >= 0.5 ? 'text-orange-600 bg-orange-50' : 'text-yellow-600 bg-yellow-50';
                    return (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{alert.fraud_type}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskClass}`}>
                            {Math.round(risk * 100)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{new Date(alert.detected_at).toLocaleString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions', color: 'blue' },
            { href: '/fraud', icon: AlertTriangle, label: 'Fraude', color: 'red' },
            { href: '/audits', icon: ClipboardList, label: 'Audits', color: 'purple' },
            { href: '/receipts', icon: Receipt, label: 'Reçus', color: 'green' },
          ].map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} className={`rounded-xl p-4 flex flex-col items-center gap-2 border transition-all hover:shadow-md ${
              color === 'blue' ? 'bg-blue-50 border-blue-100 hover:bg-blue-100' :
              color === 'red' ? 'bg-red-50 border-red-100 hover:bg-red-100' :
              color === 'purple' ? 'bg-purple-50 border-purple-100 hover:bg-purple-100' :
              'bg-blue-50 border-green-100 hover:bg-blue-100'
            }`}>
              <Icon className={`h-6 w-6 ${color === 'blue' ? 'text-blue-600' : color === 'red' ? 'text-red-600' : color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`} />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
