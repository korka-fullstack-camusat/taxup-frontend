'use client';

import { useEffect, useState } from 'react';
import { Receipt, Search, Download, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';

interface FiscalReceipt {
  id: string;
  receipt_number: string;
  transaction_id: string;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  fiscal_period: string;
  issued_at: string;
  is_cancelled: boolean;
}

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'receipt_number', label: 'N° Reçu' },
  { key: 'fiscal_period',  label: 'Période fiscale' },
  { key: 'total_amount',   label: 'Montant total (XOF)' },
  { key: 'tax_amount',     label: 'Taxe (XOF)' },
  { key: 'tax_rate',       label: 'Taux de taxe' },
  { key: 'is_cancelled',   label: 'Annulé' },
  { key: 'issued_at',      label: 'Émis le' },
  { key: 'transaction_id', label: 'ID Transaction', defaultSelected: false },
  { key: 'id',             label: 'ID Reçu',        defaultSelected: false },
];

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<FiscalReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    api.get(`/receipts?page=${page}&page_size=${pageSize}`)
      .then(res => { setReceipts(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = receipts.filter(r =>
    !search || r.receipt_number.toLowerCase().includes(search.toLowerCase()) || r.fiscal_period.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Reçus fiscaux" subtitle={`${total} reçu${total > 1 ? 's' : ''} émis`} />
      <main className="flex-1 p-6 space-y-4">
        {/* Search + export */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Numéro de reçu, période..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowExport(true)}
            disabled={receipts.length === 0}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun reçu fiscal trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">N° Reçu</th>
                      <th className="px-6 py-3 text-left">Période fiscale</th>
                      <th className="px-6 py-3 text-right">Montant total</th>
                      <th className="px-6 py-3 text-right">Taxe</th>
                      <th className="px-6 py-3 text-center">Taux</th>
                      <th className="px-6 py-3 text-center">Statut</th>
                      <th className="px-6 py-3 text-left">Émis le</th>
                      <th className="px-6 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-700 font-medium">{r.receipt_number}</td>
                        <td className="px-6 py-4 text-gray-600">{r.fiscal_period}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatXOF(r.total_amount)}</td>
                        <td className="px-6 py-4 text-right text-blue-700 font-medium">{formatXOF(r.tax_amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                            {(r.tax_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {r.is_cancelled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-medium">
                              <XCircle className="h-3 w-3" /> Annulé
                            </span>
                          ) : (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">Valide</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">{new Date(r.issued_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={async () => { try { const res = await api.get(`/receipts/${r.id}/download`, { responseType: 'blob' }); const url = URL.createObjectURL(res.data); const a = document.createElement('a'); a.href = url; a.download = `recu-${r.receipt_number}.txt`; a.click(); URL.revokeObjectURL(url); } catch {} }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} · {total} résultats</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Précédent</button>
                  <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showExport && (
        <ExportModal
          title="Reçus fiscaux TAXUP"
          fields={EXPORT_FIELDS}
          data={receipts as unknown as Record<string, unknown>[]}
          filename="taxup_recus_fiscaux"
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
