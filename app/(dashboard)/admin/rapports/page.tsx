'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel, exportPDF } from '@/lib/export';

interface FiscalReport {
  period: string;
  receipt_count: number;
  total_tax_xof: number;
  total_volume_xof: number;
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  tax_collected: number;
  fraud_alerts: number;
  new_users: number;
  receipts: number;
}

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

export default function RapportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<FiscalReport[]>([]);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
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
      const [fRes, eRes] = await Promise.allSettled([
        api.get('/dashboard/fiscal-reports'),
        api.get(`/dashboard/evolution?days=${period}`),
      ]);
      if (fRes.status === 'fulfilled') setReports(fRes.value.data.fiscal_reports || []);
      if (eRes.status === 'fulfilled') setEvolution(eRes.value.data.evolution || []);
    } finally { setLoading(false); }
  };

  const handleExportFiscal = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Rapports Fiscaux'); return; }
    const cols = [
      { key: 'period', label: 'P\u00e9riode' },
      { key: 'receipt_count', label: 'Re\u00e7us' },
      { key: 'total_tax_xof', label: 'TVA (XOF)' },
      { key: 'total_volume_xof', label: 'Volume (XOF)' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(reports as unknown as Record<string, unknown>[], 'rapports-fiscaux', cols);
  };

  const handleExportEvolution = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Rapport d\'\u00e9volution'); return; }
    const cols = [
      { key: 'date', label: 'Date' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'volume', label: 'Volume (XOF)' },
      { key: 'tax_collected', label: 'TVA (XOF)' },
      { key: 'fraud_alerts', label: 'Alertes Fraude' },
      { key: 'new_users', label: 'Nouveaux Utilisateurs' },
      { key: 'receipts', label: 'Re\u00e7us' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(evolution as unknown as Record<string, unknown>[], `rapport-evolution-${period}j`, cols);
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  const totalTx = evolution.reduce((s, d) => s + d.transactions, 0);
  const totalVol = evolution.reduce((s, d) => s + d.volume, 0);
  const totalTax = evolution.reduce((s, d) => s + d.tax_collected, 0);

  return (
    <div className="p-6 space-y-6" data-export>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
          <p className="text-gray-500 text-sm mt-1">G\u00e9n\u00e9rer et exporter les rapports de la plateforme</p>
        </div>
        <select value={period} onChange={e => setPeriod(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Transactions ({period}j)</p>
              <p className="text-2xl font-bold text-gray-800">{totalTx.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">Volume ({period}j)</p>
              <p className="text-2xl font-bold text-blue-600">{formatXOF(totalVol)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">TVA collect\u00e9e ({period}j)</p>
              <p className="text-2xl font-bold text-green-600">{formatXOF(totalTax)}</p>
            </div>
          </div>

          {/* Evolution Report */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Rapport d&apos;\u00e9volution quotidienne
              </h2>
              <ExportMenu onExport={handleExportEvolution} />
            </div>
            {evolution.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune donn\u00e9e</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TVA</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Alertes</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Re\u00e7us</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {evolution.map(d => (
                      <tr key={d.date} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{d.date}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{d.transactions}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{formatXOF(d.volume)}</td>
                        <td className="px-6 py-3 text-right font-medium text-green-700">{formatXOF(d.tax_collected)}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{d.fraud_alerts}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{d.receipts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Fiscal Reports */}
          {reports.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Rapports par p\u00e9riode fiscale
                </h2>
                <ExportMenu onExport={handleExportFiscal} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">P\u00e9riode</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Re\u00e7us</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TVA Collect\u00e9e</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Total</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map(r => (
                      <tr key={r.period} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{r.period}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{r.receipt_count.toLocaleString('fr-FR')}</td>
                        <td className="px-6 py-3 text-right font-medium text-green-700">{formatXOF(r.total_tax_xof)}</td>
                        <td className="px-6 py-3 text-right text-gray-600">{formatXOF(r.total_volume_xof)}</td>
                        <td className="px-6 py-3 text-right text-gray-500">
                          {r.total_volume_xof > 0 ? ((r.total_tax_xof / r.total_volume_xof) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExportMenu({ onExport }: { onExport: (f: 'csv' | 'excel' | 'pdf') => void }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
        <Download className="h-4 w-4" /> Exporter
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-20 min-w-[130px]">
        <button onClick={() => onExport('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
        <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
        <button onClick={() => onExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF / Imprimer</button>
      </div>
    </div>
  );
}
