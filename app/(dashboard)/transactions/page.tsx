'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Search, Filter, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string;
  created_at: string;
  sender_phone?: string;
  recipient_phone?: string;
  description?: string;
  risk_score?: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Complété', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  FAILED: { label: 'Échoué', color: 'text-red-600 bg-red-50', icon: XCircle },
  FLAGGED: { label: 'Signalé', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('transaction_type', typeFilter);
    api.get(`/transactions?${params}`)
      .then(res => { setTransactions(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, statusFilter, typeFilter]);

  const filtered = transactions.filter(t =>
    !search || t.sender_phone?.includes(search) || t.recipient_phone?.includes(search) || t.id.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Transactions" subtitle={`${total} transaction${total > 1 ? 's' : ''} au total`} />
      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Tous les statuts</option>
              <option value="COMPLETED">Complété</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoué</option>
              <option value="FLAGGED">Signalé</option>
            </select>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Tous les types</option>
              {Object.entries(typeLabel).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction trouvée</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Émetteur</th>
                      <th className="px-6 py-3 text-left">Destinataire</th>
                      <th className="px-6 py-3 text-right">Montant</th>
                      <th className="px-6 py-3 text-center">Statut</th>
                      <th className="px-6 py-3 text-center">Risque</th>
                      <th className="px-6 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(tx => {
                      const s = statusConfig[tx.status] || statusConfig.PENDING;
                      const StatusIcon = s.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-800">{typeLabel[tx.transaction_type] || tx.transaction_type}</td>
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.sender_phone || '—'}</td>
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.recipient_phone || '—'}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatXOF(tx.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                              <StatusIcon className="h-3 w-3" />{s.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {tx.risk_score != null ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                tx.risk_score >= 0.7 ? 'text-red-600 bg-red-50' :
                                tx.risk_score >= 0.4 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'
                              }`}>{Math.round(tx.risk_score * 100)}%</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} · {total} résultats</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Précédent
                  </button>
                  <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
