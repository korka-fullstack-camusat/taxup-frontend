'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Filter, Download } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';
import Pagination from '@/components/Pagination';

interface FraudAlert {
  id: string;
  transaction_id: string;
  fraud_type: string;
  risk_score: number;
  status: string;
  details?: Record<string, unknown>;
  detected_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50' },
  UNDER_REVIEW: { label: 'En révision', color: 'text-blue-600 bg-blue-50' },
  CONFIRMED: { label: 'Confirmé', color: 'text-red-600 bg-red-50' },
  DISMISSED: { label: 'Rejeté', color: 'text-gray-600 bg-gray-100' },
};

const fraudTypeLabel: Record<string, string> = {
  STRUCTURING: 'Fragmentation', RAPID_TRANSFER: 'Transfert rapide',
  UNUSUAL_PATTERN: 'Schéma inhabituel', SUSPICIOUS_AMOUNT: 'Montant suspect',
  VELOCITY_ABUSE: 'Abus de fréquence',
};

function riskLevel(score: number) {
  if (score >= 0.8) return { label: 'Critique', color: 'text-red-700 bg-red-100' };
  if (score >= 0.6) return { label: 'Élevé', color: 'text-orange-600 bg-orange-50' };
  if (score >= 0.4) return { label: 'Moyen', color: 'text-yellow-600 bg-yellow-50' };
  return { label: 'Faible', color: 'text-blue-600 bg-blue-50' };
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'fraud_type',     label: 'Type de fraude' },
  { key: 'risk_score',     label: 'Score de risque (%)' },
  { key: 'status',         label: 'Statut' },
  { key: 'transaction_id', label: 'ID Transaction' },
  { key: 'detected_at',    label: 'Détecté le' },
  { key: 'id',             label: 'ID Alerte', defaultSelected: false },
];

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) params.append('status', statusFilter);
    if (minRisk) params.append('min_risk_score', minRisk);
    api.get(`/fraud/alerts?${params}`)
      .then(res => { setAlerts(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, statusFilter, minRisk]);

  // For export: normalize risk_score to percentage string
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
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select value={minRisk} onChange={e => { setMinRisk(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tout niveau de risque</option>
            <option value="0.4">≥ 40% (Moyen+)</option>
            <option value="0.6">≥ 60% (Élevé+)</option>
            <option value="0.8">≥ 80% (Critique)</option>
          </select>
          <button
            onClick={() => setShowExport(true)}
            disabled={alerts.length === 0}
            className="ml-auto flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exporter
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
                      <th className="px-6 py-3 text-center">Score de risque</th>
                      <th className="px-6 py-3 text-center">Niveau</th>
                      <th className="px-6 py-3 text-center">Statut</th>
                      <th className="px-6 py-3 text-left">ID Transaction</th>
                      <th className="px-6 py-3 text-left">Détecté le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alerts.map(alert => {
                      const s = statusConfig[alert.status] || statusConfig.PENDING;
                      const risk = riskLevel(alert.risk_score);
                      return (
                        <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${alert.risk_score >= 0.7 ? 'text-red-500' : 'text-orange-400'}`} />
                              <span className="font-medium text-gray-800">{fraudTypeLabel[alert.fraud_type] || alert.fraud_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${alert.risk_score >= 0.7 ? 'bg-red-500' : alert.risk_score >= 0.4 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                                  style={{ width: `${alert.risk_score * 100}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{Math.round(alert.risk_score * 100)}%</span>
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
              <Pagination
                page={page} total={total} pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={size => { setPageSize(size); setPage(1); }}
              />
            </>
          )}
        </div>
      </main>

      {showExport && (
        <ExportModal
          title="Alertes de fraude TAXUP"
          fields={EXPORT_FIELDS}
          data={exportData as unknown as Record<string, unknown>[]}
          filename="taxup_alertes_fraude"
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
