'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Filter, Download, X, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ExportModal, { ExportField } from '@/components/ExportModal';
import Pagination from '@/components/Pagination';

interface FraudAlert {
  id: string;
  transaction_id: string;
  fraud_type: string;
  risk_score: number;
  status: string;
  description?: string;
  details?: Record<string, unknown>;
  detected_at: string;
  resolved_at?: string;
}

interface FraudStats {
  total_alerts: number;
  pending_alerts: number;
  high_risk: number;
  by_type?: Record<string, number>;
  by_status?: Record<string, number>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DETECTED:       { label: 'Détecté',          color: 'text-yellow-700 bg-yellow-50' },
  INVESTIGATING:  { label: 'En investigation', color: 'text-blue-700 bg-blue-50' },
  CONFIRMED:      { label: 'Confirmé',         color: 'text-red-700 bg-red-50' },
  FALSE_POSITIVE: { label: 'Faux positif',     color: 'text-gray-600 bg-gray-100' },
  RESOLVED:       { label: 'Résolu',           color: 'text-green-700 bg-green-50' },
};

const fraudTypeLabel: Record<string, string> = {
  VELOCITY:        'Fréquence élevée',
  LARGE_AMOUNT:    'Montant suspect',
  ROUND_TRIPPING:  'Aller-retour',
  STRUCTURING:     'Fragmentation',
  UNUSUAL_PATTERN: 'Schéma inhabituel',
  BLACKLISTED:     'Liste noire',
};

function riskLevel(score: number) {
  if (score >= 0.8) return { label: 'Critique', color: 'text-red-700 bg-red-100' };
  if (score >= 0.6) return { label: 'Élevé',    color: 'text-orange-600 bg-orange-50' };
  if (score >= 0.4) return { label: 'Moyen',    color: 'text-yellow-600 bg-yellow-50' };
  return { label: 'Faible', color: 'text-green-600 bg-green-50' };
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'fraud_type',     label: 'Type de fraude' },
  { key: 'risk_score',     label: 'Score de risque (%)' },
  { key: 'status',         label: 'Statut' },
  { key: 'description',    label: 'Description', defaultSelected: false },
  { key: 'transaction_id', label: 'ID Transaction' },
  { key: 'detected_at',    label: 'Détecté le' },
  { key: 'resolved_at',    label: 'Résolu le', defaultSelected: false },
  { key: 'id',             label: 'ID Alerte', defaultSelected: false },
];

export default function FraudPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [fraudTypeFilter, setFraudTypeFilter] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<FraudAlert | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const canUpdate = ['AGENT_DGID', 'AUDITEUR_FISCAL', 'ADMIN'].includes(user?.role || '');

  const fetchAlerts = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) params.append('status', statusFilter);
    if (fraudTypeFilter) params.append('fraud_type', fraudTypeFilter);
    if (minRisk) params.append('min_risk_score', minRisk);
    api.get(`/fraud/alerts?${params}`)
      .then(res => { setAlerts(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get('/fraud/statistics').then(res => setStats(res.data)).catch(() => {});
  };

  useEffect(() => { fetchAlerts(); }, [page, statusFilter, fraudTypeFilter, minRisk, pageSize]);
  useEffect(() => { fetchStats(); }, []);

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      const payload: Record<string, string> = { status: newStatus };
      if (updateNote) payload.description = updateNote;
      await api.patch(`/fraud/alerts/${selected.id}`, payload);
      setSelected(null);
      setNewStatus('');
      setUpdateNote('');
      fetchAlerts();
      fetchStats();
    } catch {} finally {
      setUpdating(false);
    }
  };

  const openDetail = (alert: FraudAlert) => {
    setSelected(alert);
    setNewStatus(alert.status);
    setUpdateNote('');
  };

  const exportData = alerts.map(a => ({
    ...a,
    fraud_type: fraudTypeLabel[a.fraud_type] || a.fraud_type,
    risk_score: `${Math.round(a.risk_score * 100)}%`,
    status: statusConfig[a.status]?.label || a.status,
  }));

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Alertes de fraude" subtitle={`${total} alerte${total > 1 ? 's' : ''} détectée${total > 1 ? 's' : ''}`} />
      <main className="flex-1 p-6 space-y-4">

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatMini value={stats.total_alerts} label="Total alertes" color="gray" />
            <StatMini value={stats.pending_alerts} label="En attente" color="yellow" />
            <StatMini value={stats.high_risk} label="Haut risque (≥80%)" color="red" />
            <StatMini value={stats.by_status?.RESOLVED ?? 0} label="Résolus" color="green" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select value={fraudTypeFilter} onChange={e => { setFraudTypeFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les types</option>
            {Object.entries(fraudTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={minRisk} onChange={e => { setMinRisk(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tout risque</option>
            <option value="0.4">≥ 40% (Moyen+)</option>
            <option value="0.6">≥ 60% (Élevé+)</option>
            <option value="0.8">≥ 80% (Critique)</option>
          </select>
          {(statusFilter || fraudTypeFilter || minRisk) && (
            <button onClick={() => { setStatusFilter(''); setFraudTypeFilter(''); setMinRisk(''); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium">Réinitialiser</button>
          )}
          <button onClick={() => setShowExport(true)} disabled={alerts.length === 0}
            className="ml-auto flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40">
            <Download className="h-4 w-4" /> Exporter
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune alerte de fraude</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Type de fraude</th>
                      <th className="px-6 py-3 text-center">Score</th>
                      <th className="px-6 py-3 text-center">Niveau</th>
                      <th className="px-6 py-3 text-center">Statut</th>
                      <th className="px-6 py-3 text-left">Transaction</th>
                      <th className="px-6 py-3 text-left">Détecté le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alerts.map(alert => {
                      const s = statusConfig[alert.status] || { label: alert.status, color: 'text-gray-600 bg-gray-100' };
                      const risk = riskLevel(alert.risk_score);
                      return (
                        <tr key={alert.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => openDetail(alert)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${alert.risk_score >= 0.7 ? 'text-red-500' : 'text-orange-400'}`} />
                              <span className="font-medium text-gray-800">{fraudTypeLabel[alert.fraud_type] || alert.fraud_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${alert.risk_score >= 0.7 ? 'bg-red-500' : alert.risk_score >= 0.4 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                                  style={{ width: `${alert.risk_score * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700 w-8">{Math.round(alert.risk_score * 100)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${risk.color}`}>{risk.label}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[120px]">{alert.transaction_id}</td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(alert.detected_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} total={total} pageSize={pageSize}
                onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
            </>
          )}
        </div>
      </main>

      {/* Detail / Update modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-5 ${selected.risk_score >= 0.7 ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Alerte de fraude</span>
                <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-base">{fraudTypeLabel[selected.fraud_type] || selected.fraud_type}</p>
                  <p className="text-white/70 text-sm mt-0.5">{new Date(selected.detected_at).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-2xl">{Math.round(selected.risk_score * 100)}%</p>
                  <p className="text-white/70 text-xs">Score de risque</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium">Statut actuel</p>
                  <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig[selected.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusConfig[selected.status]?.label || selected.status}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium">Niveau</p>
                  <span className={`mt-1 inline-block text-xs font-bold px-2.5 py-1 rounded-full ${riskLevel(selected.risk_score).color}`}>
                    {riskLevel(selected.risk_score).label}
                  </span>
                </div>
              </div>
              {selected.description && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium">Description</p>
                  <p className="text-sm text-gray-700 mt-0.5">{selected.description}</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 font-medium">ID Transaction</p>
                <p className="text-xs font-mono text-gray-500 break-all mt-0.5">{selected.transaction_id}</p>
              </div>
              {selected.resolved_at && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-700 font-medium">Résolu le {new Date(selected.resolved_at).toLocaleString('fr-FR')}</p>
                </div>
              )}

              {/* Update form */}
              {canUpdate && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Mettre à jour le statut</p>
                  <div className="relative">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <textarea value={updateNote} onChange={e => setUpdateNote(e.target.value)}
                    placeholder="Note (optionnelle)..." rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(null)}
                      className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                      Fermer
                    </button>
                    <button onClick={handleUpdateStatus} disabled={updating || newStatus === selected.status}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
                      {updating ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </div>
              )}
              {!canUpdate && (
                <button onClick={() => setSelected(null)}
                  className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors">
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal title="Alertes de fraude TAXUP" fields={EXPORT_FIELDS}
          data={exportData as unknown as Record<string, unknown>[]} filename="taxup_alertes_fraude"
          onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function StatMini({ value, label, color }: { value: number; label: string; color: string }) {
  const borderColors: Record<string, string> = {
    gray: 'border-gray-100', yellow: 'border-yellow-100', red: 'border-red-100', green: 'border-green-100',
  };
  const textColors: Record<string, string> = {
    gray: 'text-gray-800', yellow: 'text-yellow-600', red: 'text-red-600', green: 'text-green-600',
  };
  return (
    <div className={`bg-white rounded-xl border ${borderColors[color] || 'border-gray-100'} shadow-sm p-4`}>
      <p className={`text-2xl font-bold ${textColors[color] || 'text-gray-800'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
