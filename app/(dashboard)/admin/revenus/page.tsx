'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel, exportPDF } from '@/lib/export';

interface FiscalReport {
  period: string;
  receipt_count: number;
  total_tax_xof: number;
  total_volume_xof: number;
}

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

export default function AnalyseRevenusPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<FiscalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<{ month_tax: number; total_tax: number; total_volume: number; total_receipts: number }>({
    month_tax: 0, total_tax: 0, total_volume: 0, total_receipts: 0,
  });

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fiscalRes, summaryRes] = await Promise.allSettled([
        api.get('/dashboard/fiscal-reports'),
        api.get('/dashboard/admin-summary'),
      ]);
      if (fiscalRes.status === 'fulfilled') setReports(fiscalRes.value.data.fiscal_reports || []);
      if (summaryRes.status === 'fulfilled') {
        const f = summaryRes.value.data.fiscal;
        setOverview({
          month_tax: f.month_tax_collected_xof, total_tax: f.total_tax_collected_xof,
          total_volume: f.total_volume_xof, total_receipts: f.total_receipts,
        });
      }
    } finally { setLoading(false); }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Analyse des Revenus'); return; }
    const cols = [
      { key: 'period', label: 'Période' },
      { key: 'receipt_count', label: 'Nombre de reçus' },
      { key: 'total_tax_xof', label: 'TVA Collectée (XOF)' },
      { key: 'total_volume_xof', label: 'Volume Total (XOF)' },
    ];
    const fn = format === 'csv' ? exportCSV : exportExcel;
    fn(reports as unknown as Record<string, unknown>[], 'taxup-revenus-fiscaux', cols);
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="p-6 space-y-6" data-export>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analyse des Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">Synthèse des revenus fiscaux par période</p>
        </div>
        <ExportMenu onExport={handleExport} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="TVA ce mois" value={formatXOF(overview.month_tax)} color="text-blue-600" />
            <StatCard label="TVA cumulée" value={formatXOF(overview.total_tax)} color="text-green-600" />
            <StatCard label="Volume total" value={formatXOF(overview.total_volume)} color="text-purple-600" />
            <StatCard label="Total reçus" value={overview.total_receipts.toLocaleString('fr-FR')} color="text-orange-600" />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Détail par période fiscale</h2>
            </div>
            {reports.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune donnée</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Période</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Reçus</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TVA Collectée</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Total</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Taux Effectif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map(r => (
                      <tr key={r.period} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{r.period}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{r.receipt_count.toLocaleString('fr-FR')}</td>
                        <td className="px-6 py-4 text-right font-medium text-green-700">{formatXOF(r.total_tax_xof)}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatXOF(r.total_volume_xof)}</td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {r.total_volume_xof > 0 ? ((r.total_tax_xof / r.total_volume_xof) * 100).toFixed(1) : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ExportMenu({ onExport }: { onExport: (f: 'csv' | 'excel' | 'pdf') => void }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <Download className="h-4 w-4" /> Exporter
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-20 min-w-[140px]">
        <button onClick={() => onExport('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
        <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
        <button onClick={() => onExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF / Imprimer</button>
      </div>
    </div>
  );
}
