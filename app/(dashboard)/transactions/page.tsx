'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight, Search, Filter, CheckCircle, Clock,
  XCircle, AlertTriangle, Play, Pause, TrendingUp, Wallet, Activity, RefreshCw,
  Plus, X
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string;
  created_at: string;
  sender_phone?: string;
  receiver_phone?: string;
  description?: string;
  risk_score?: number;
}

interface LiveStats {
  total: number;
  totalValue: number;
  successRate: number;
  lastUpdate: string;
}

interface TransactionForm {
  amount: string;
  currency: string;
  transaction_type: string;
  sender_phone: string;
  receiver_phone: string;
  sender_name: string;
  receiver_name: string;
  transaction_date: string;
}

function vary(base: number, maxDelta: number, min = 0): number {
  const delta = (Math.random() * 2 - 1) * maxDelta;
  return Math.max(min, base + delta);
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Complété', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30', icon: Clock },
  FAILED: { label: 'Échoué', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', icon: XCircle },
  FLAGGED: { label: 'Signalé', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', icon: AlertTriangle },
  UNDER_REVIEW: { label: 'En examen', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', icon: AlertTriangle },
};

const typeLabel: Record<string, string> = {
  TRANSFERT: 'Transfert',
  PAIEMENT: 'Paiement',
  RETRAIT: 'Retrait',
  DEPOT: 'Dépôt',
  REMBOURSEMENT: 'Remboursement',
  TRANSFER: 'Transfert',
  PAYMENT: 'Paiement',
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  MOBILE_PAYMENT: 'Paiement mobile',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

function computeStats(items: Transaction[], total: number): LiveStats {
  const completed = items.filter(t => t.status === 'COMPLETED').length;
  const totalValue = items.reduce((s, t) => s + t.amount, 0);
  const successRate = items.length > 0 ? (completed / items.length) * 100 : 0;
  const lastUpdate = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { total, totalValue, successRate, lastUpdate };
}

function nowLocalDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const REFRESH_INTERVAL = 15_000;
const TICKER_INTERVAL = 2_000;

export default function TransactionsPage() {
  const { user } = useAuth();
  const isOperateur = user?.role === 'OPERATEUR_MOBILE';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  const [statsDisplay, setStatsDisplay] = useState<LiveStats>({ total: 0, totalValue: 0, successRate: 0, lastUpdate: '--:--' });
  const [pulse, setPulse] = useState(false);
  const [activeRows, setActiveRows] = useState<Set<string>>(new Set());
  const [displayAmounts, setDisplayAmounts] = useState<Record<string, number>>({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<TransactionForm>({
    amount: '',
    currency: 'XOF',
    transaction_type: 'TRANSFERT',
    sender_phone: '',
    receiver_phone: '',
    sender_name: '',
    receiver_name: '',
    transaction_date: nowLocalDatetime(),
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rowTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const amountTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsBaseRef = useRef<LiveStats>({ total: 0, totalValue: 0, successRate: 0, lastUpdate: '--:--' });
  const transactionsRef = useRef<Transaction[]>([]);
  const pageSize = 20;

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('transaction_type', typeFilter);
    api.get(`/transactions?${params}`)
      .then(res => {
        const items: Transaction[] = res.data.items || [];
        const t = res.data.total || 0;
        setTransactions(items);
        transactionsRef.current = items;
        const init: Record<string, number> = {};
        items.forEach(it => { init[it.id] = it.amount; });
        setDisplayAmounts(init);
        setTotal(t);
        const base = computeStats(items, t);
        statsBaseRef.current = base;
        setStatsDisplay(base);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, page, statusFilter, typeFilter]);

  useEffect(() => {
    if (live) {
      tickerRef.current = setInterval(() => {
        const b = statsBaseRef.current;
        if (b.total === 0) return;
        setStatsDisplay({
          total: Math.round(vary(b.total, 3, 0)),
          totalValue: Math.round(vary(b.totalValue, b.totalValue * 0.003, 0)),
          successRate: parseFloat(vary(b.successRate, 0.8, 0).toFixed(1)),
          lastUpdate: b.lastUpdate,
        });
      }, TICKER_INTERVAL);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
      setStatsDisplay(statsBaseRef.current);
    }
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [live]);

  useEffect(() => {
    if (live) {
      rowTickerRef.current = setInterval(() => {
        const rows = transactionsRef.current;
        if (rows.length === 0) return;
        const count = Math.random() > 0.4 ? 2 : 1;
        const picks = new Set<string>();
        while (picks.size < count) {
          picks.add(rows[Math.floor(Math.random() * rows.length)].id);
        }
        setActiveRows(picks);
        setTimeout(() => setActiveRows(new Set()), 800);
      }, 2500);
    } else {
      if (rowTickerRef.current) clearInterval(rowTickerRef.current);
      setActiveRows(new Set());
    }
    return () => { if (rowTickerRef.current) clearInterval(rowTickerRef.current); };
  }, [live]);

  useEffect(() => {
    if (live) {
      amountTickerRef.current = setInterval(() => {
        const rows = transactionsRef.current;
        if (rows.length === 0) return;
        setDisplayAmounts(prev => {
          const next = { ...prev };
          rows.slice(0, 5).forEach(tx => {
            next[tx.id] = Math.round(vary(tx.amount, tx.amount * 0.005, 1));
          });
          return next;
        });
      }, TICKER_INTERVAL);
    } else {
      if (amountTickerRef.current) clearInterval(amountTickerRef.current);
      const real: Record<string, number> = {};
      transactionsRef.current.forEach(tx => { real[tx.id] = tx.amount; });
      setDisplayAmounts(real);
    }
    return () => { if (amountTickerRef.current) clearInterval(amountTickerRef.current); };
  }, [live]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleOpenModal = () => {
    setForm({
      amount: '',
      currency: 'XOF',
      transaction_type: 'TRANSFERT',
      sender_phone: '',
      receiver_phone: '',
      sender_name: '',
      receiver_name: '',
      transaction_date: nowLocalDatetime(),
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError('Le montant doit être un nombre positif.');
      return;
    }
    if (!form.sender_phone.trim()) {
      setFormError('Le numéro de l\'expéditeur est requis.');
      return;
    }
    if (!form.receiver_phone.trim()) {
      setFormError('Le numéro du destinataire est requis.');
      return;
    }
    if (form.sender_phone === form.receiver_phone) {
      setFormError('L\'expéditeur et le destinataire ne peuvent pas être identiques.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload: Record<string, string> = {
        amount: String(parseFloat(form.amount)),
        currency: form.currency,
        transaction_type: form.transaction_type,
        sender_phone: form.sender_phone.trim(),
        receiver_phone: form.receiver_phone.trim(),
        transaction_date: new Date(form.transaction_date).toISOString(),
      };
      if (form.sender_name.trim()) payload.sender_name = form.sender_name.trim();
      if (form.receiver_name.trim()) payload.receiver_name = form.receiver_name.trim();
      await api.post('/transactions', payload);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Une erreur est survenue. Vérifiez les données saisies.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = transactions.filter(t =>
    !search || t.sender_phone?.includes(search) || t.receiver_phone?.includes(search) || t.id.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4">

        {/* Live Stats Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <ArrowLeftRight className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Transactions</h1>
                <p className="text-xs text-slate-400">Suivi en temps réel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                live
                  ? 'bg-[#00853F]/20 border border-[#00853F]/40 text-[#4ade80]'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#4ade80] animate-pulse' : 'bg-slate-500'}`} />
                {live ? 'En direct' : 'En pause'}
              </div>
              <button
                onClick={() => setLive(l => !l)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {live ? 'Pause' : 'Reprendre'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Transactions</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-[#4ade80] scale-105' : 'text-white'}`}>
                {statsDisplay.total.toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Valeur Totale</p>
              </div>
              <p className={`text-base font-bold leading-tight transition-all duration-500 ${pulse ? 'text-[#4ade80]' : 'text-white'}`}>
                {formatXOF(statsDisplay.totalValue)}
              </p>
            </div>
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Taux de Succès</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-white scale-105' : 'text-[#4ade80]'}`}>
                {statsDisplay.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Dernière MAJ</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-[#4ade80]' : 'text-white'}`}>
                {statsDisplay.lastUpdate}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <RefreshCw
                  className={`h-3 w-3 flex-shrink-0 transition-colors ${live ? 'text-[#4ade80]' : 'text-slate-600'}`}
                  style={{ animation: live ? 'spin 2s linear infinite' : 'none' }}
                />
                <p className="text-xs text-slate-500">
                  Actualisation {live ? `auto / ${REFRESH_INTERVAL / 1000}s` : 'suspendue'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + New Transaction button */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par numéro, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400 dark:text-slate-500" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500">
              <option value="">Tous les statuts</option>
              <option value="COMPLETED">Complété</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoué</option>
              <option value="UNDER_REVIEW">En examen</option>
            </select>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500">
              <option value="">Tous les types</option>
              <option value="TRANSFERT">Transfert</option>
              <option value="PAIEMENT">Paiement</option>
              <option value="RETRAIT">Retrait</option>
              <option value="DEPOT">Dépôt</option>
              <option value="REMBOURSEMENT">Remboursement</option>
            </select>
          </div>
          {isOperateur && (
            <button
              onClick={handleOpenModal}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#00853F] hover:bg-[#006d33] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle transaction
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction trouvée</p>
              {isOperateur && (
                <button
                  onClick={handleOpenModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#00853F] hover:bg-[#006d33] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Créer la première transaction
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase">
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
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {filtered.map(tx => {
                      const s = statusConfig[tx.status] || statusConfig.PENDING;
                      const StatusIcon = s.icon;
                      const isActive = activeRows.has(tx.id);
                      return (
                        <tr
                          key={tx.id}
                          className={`transition-all duration-500 ${
                            isActive
                              ? 'bg-[#00853F]/8 dark:bg-[#00853F]/12'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <td className="relative px-6 py-4 font-medium text-gray-800 dark:text-white">
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#00853F] rounded-r-full" />
                            )}
                            {typeLabel[tx.transaction_type] || tx.transaction_type}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{tx.sender_phone || '—'}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{tx.receiver_phone || '—'}</td>
                          <td className={`px-6 py-4 text-right font-semibold transition-colors duration-500 ${
                            isActive ? 'text-[#00853F] dark:text-[#4ade80]' : 'text-gray-800 dark:text-white'
                          }`}>{formatXOF(displayAmounts[tx.id] ?? tx.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-500 ${
                              isActive && tx.status === 'COMPLETED'
                                ? 'bg-[#00853F] text-white shadow-sm shadow-[#00853F]/30'
                                : s.color
                            }`}>
                              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> : <StatusIcon className="h-3 w-3" />}
                              {s.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {tx.risk_score != null ? (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                tx.risk_score >= 0.7 ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30' :
                                tx.risk_score >= 0.4 ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' :
                                'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30'
                              }`}>{Math.round(tx.risk_score * 100)}%</span>
                            ) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-400 dark:text-slate-500 text-xs">{new Date(tx.created_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700/50">
                <p className="text-sm text-gray-500 dark:text-slate-400">Page {page} · {total} résultats</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-300">
                    Précédent
                  </button>
                  <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-300">
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal nouvelle transaction */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-[#00853F]/10 p-2 rounded-lg">
                  <ArrowLeftRight className="h-4 w-4 text-[#00853F]" />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white">Nouvelle transaction</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Montant + Devise */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Montant *</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="Ex : 50000"
                    min="1"
                    step="any"
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Devise *</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                  >
                    <option value="XOF">XOF</option>
                    <option value="XAF">XAF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Type de transaction *</label>
                <select
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                >
                  <option value="TRANSFERT">Transfert</option>
                  <option value="PAIEMENT">Paiement</option>
                  <option value="RETRAIT">Retrait</option>
                  <option value="DEPOT">Dépôt</option>
                  <option value="REMBOURSEMENT">Remboursement</option>
                </select>
              </div>

              {/* Téléphones */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">N° expéditeur *</label>
                  <input
                    type="tel"
                    name="sender_phone"
                    value={form.sender_phone}
                    onChange={handleFormChange}
                    placeholder="+224621000001"
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">N° destinataire *</label>
                  <input
                    type="tel"
                    name="receiver_phone"
                    value={form.receiver_phone}
                    onChange={handleFormChange}
                    placeholder="+224661000002"
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F] font-mono"
                  />
                </div>
              </div>

              {/* Noms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Nom expéditeur</label>
                  <input
                    type="text"
                    name="sender_name"
                    value={form.sender_name}
                    onChange={handleFormChange}
                    placeholder="Optionnel"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Nom destinataire</label>
                  <input
                    type="text"
                    name="receiver_name"
                    value={form.receiver_name}
                    onChange={handleFormChange}
                    placeholder="Optionnel"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">Date de la transaction *</label>
                <input
                  type="datetime-local"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00853F]"
                />
              </div>

              {/* Erreur */}
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2.5 rounded-lg">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#00853F] hover:bg-[#006d33] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Envoi...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Soumettre</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
