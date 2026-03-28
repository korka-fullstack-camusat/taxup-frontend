'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Search, Filter, CheckCircle, Clock, XCircle, Eye, X, Download, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';
import Pagination from '@/components/Pagination';

interface Transaction {
  id: string;
  reference: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string;
  created_at: string;
  transaction_date: string;
  sender_phone: string;
  receiver_phone: string;
  sender_name?: string;
  receiver_name?: string;
  description?: string;
  external_reference?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED:    { label: 'Complété',    color: 'text-green-600 bg-green-50',  icon: CheckCircle },
  PENDING:      { label: 'En attente',  color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  FAILED:       { label: 'Échoué',      color: 'text-red-600 bg-red-50',      icon: XCircle },
  CANCELLED:    { label: 'Annulé',      color: 'text-gray-600 bg-gray-100',   icon: XCircle },
  UNDER_REVIEW: { label: 'En révision', color: 'text-blue-600 bg-blue-50',    icon: AlertCircle },
};

const typeLabel: Record<string, string> = {
  TRANSFERT:     'Transfert',
  PAIEMENT:      'Paiement',
  RETRAIT:       'Retrait',
  DEPOT:         'Dépôt',
  REMBOURSEMENT: 'Remboursement',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

const EXPORT_FIELDS: ExportField[] = [
  { key: 'reference',        label: 'Référence' },
  { key: 'transaction_type', label: 'Type' },
  { key: 'sender_phone',     label: 'Émetteur (tél)' },
  { key: 'sender_name',      label: 'Nom émetteur',      defaultSelected: false },
  { key: 'receiver_phone',   label: 'Destinataire (tél)' },
  { key: 'receiver_name',    label: 'Nom destinataire',   defaultSelected: false },
  { key: 'amount',           label: 'Montant (XOF)' },
  { key: 'currency',         label: 'Devise' },
  { key: 'status',           label: 'Statut' },
  { key: 'transaction_date', label: 'Date transaction' },
  { key: 'created_at',       label: 'Créé le' },
  { key: 'id',               label: 'ID',                 defaultSelected: false },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('transaction_type', typeFilter);
    if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString());
    if (dateTo) params.append('date_to', new Date(dateTo + 'T23:59:59').toISOString());
    api.get(`/transactions?${params}`)
      .then(res => { setTransactions(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, typeFilter, dateFrom, dateTo, pageSize]);

  const filtered = transactions.filter(t =>
    !search ||
    t.sender_phone?.includes(search) ||
    t.receiver_phone?.includes(search) ||
    t.reference?.toLowerCase().includes(search.toLowerCase()) ||
    t.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.receiver_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Transactions" subtitle={`${total} transaction${total > 1 ? 's' : ''} au total`} />
      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Référence, téléphone, nom..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowExport(true)} disabled={transactions.length === 0}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40">
              <Download className="h-4 w-4" /> Exporter
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les statuts</option>
              <option value="COMPLETED">Complété</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoué</option>
              <option value="CANCELLED">Annulé</option>
              <option value="UNDER_REVIEW">En révision</option>
            </select>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les types</option>
              {Object.entries(typeLabel).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Du</span>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span>au</span>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {(statusFilter || typeFilter || dateFrom || dateTo) && (
              <button onClick={() => { setStatusFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium">
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
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
                      <th className="px-4 py-3 text-left">Référence</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Émetteur</th>
                      <th className="px-4 py-3 text-left">Destinataire</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-center">Statut</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-center">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(tx => {
                      const s = statusConfig[tx.status] || statusConfig.PENDING;
                      const StatusIcon = s.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">{tx.reference}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{typeLabel[tx.transaction_type] || tx.transaction_type}</td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 font-mono text-xs">{tx.sender_phone}</p>
                            {tx.sender_name && <p className="text-gray-400 text-xs mt-0.5">{tx.sender_name}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 font-mono text-xs">{tx.receiver_phone}</p>
                            {tx.receiver_name && <p className="text-gray-400 text-xs mt-0.5">{tx.receiver_name}</p>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatXOF(tx.amount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                              <StatusIcon className="h-3 w-3" />{s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(tx.transaction_date || tx.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setSelected(tx)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
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

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Détail transaction</span>
                <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-lg">{selected.reference}</p>
                  <p className="text-blue-200 text-sm">{typeLabel[selected.transaction_type] || selected.transaction_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xl">{formatXOF(selected.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {statusConfig[selected.status]?.label || selected.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Émetteur" value={selected.sender_phone} sub={selected.sender_name} />
                <InfoBlock label="Destinataire" value={selected.receiver_phone} sub={selected.receiver_name} />
                <InfoBlock label="Date transaction" value={new Date(selected.transaction_date || selected.created_at).toLocaleString('fr-FR')} />
                <InfoBlock label="Devise" value={selected.currency} />
              </div>
              {selected.external_reference && (
                <InfoBlock label="Référence externe" value={selected.external_reference} />
              )}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 font-medium">ID Transaction</p>
                <p className="text-xs font-mono text-gray-500 break-all mt-0.5">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal title="Transactions TAXUP" fields={EXPORT_FIELDS}
          data={transactions as unknown as Record<string, unknown>[]} filename="taxup_transactions"
          onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function InfoBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-800 font-mono mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
