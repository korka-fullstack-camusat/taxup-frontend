'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight, Search, Filter, CheckCircle, Clock,
  XCircle, AlertTriangle, Play, Pause, TrendingUp, Wallet, Activity, RefreshCw
} from 'lucide-react';
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

interface LiveStats {
  total: number;
  totalValue: number;
  successRate: number;
  lastUpdate: string;
}

// Variation aléatoire bornée autour d'une valeur
function vary(base: number, maxDelta: number, min = 0): number {
  const delta = (Math.random() * 2 - 1) * maxDelta;
  return Math.max(min, base + delta);
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Complété', color: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30', icon: Clock },
  FAILED: { label: 'Échoué', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', icon: XCircle },
  FLAGGED: { label: 'Signalé', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', icon: AlertTriangle },
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
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

const REFRESH_INTERVAL = 15_000; // 15 secondes
const TICKER_INTERVAL = 2_000;   // variation toutes les 2 secondes

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);
  // statsDisplay = valeurs affichées (légèrement variées pour simuler le flux)
  const [statsDisplay, setStatsDisplay] = useState<LiveStats>({ total: 0, totalValue: 0, successRate: 0, lastUpdate: '--:--' });
  const [pulse, setPulse] = useState(false);
  const [activeRows, setActiveRows] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rowTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
        setTotal(t);
        const base = computeStats(items, t);
        statsBaseRef.current = base;
        setStatsDisplay(base);
        // flash pulse
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  };

  // Initial + filter/page change fetch
  useEffect(() => { fetchData(); }, [page, statusFilter, typeFilter]);

  // Live API refresh
  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, page, statusFilter, typeFilter]);

  // Ticker : micro-variation des valeurs affichées toutes les 2s
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
      // repasse aux valeurs réelles
      setStatsDisplay(statsBaseRef.current);
    }
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [live]);

  // Ticker lignes : flash aléatoire sur 1-2 lignes toutes les 2.5s
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

  const filtered = transactions.filter(t =>
    !search || t.sender_phone?.includes(search) || t.recipient_phone?.includes(search) || t.id.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4">

        {/* Live Stats Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg">
          {/* Top bar: title + live indicator + pause button */}
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
              {/* Live / Paused badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                live
                  ? 'bg-[#00853F]/20 border border-[#00853F]/40 text-[#4ade80]'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#4ade80] animate-pulse' : 'bg-slate-500'}`} />
                {live ? 'En direct' : 'En pause'}
              </div>

              {/* Play / Pause button */}
              <button
                onClick={() => setLive(l => !l)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {live ? 'Pause' : 'Reprendre'}
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            {/* Transactions */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Transactions</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-[#4ade80] scale-105' : 'text-white'}`}>
                {statsDisplay.total.toLocaleString('fr-FR')}
              </p>
            </div>

            {/* Valeur Totale */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Valeur Totale</p>
              </div>
              <p className={`text-base font-bold leading-tight transition-all duration-500 ${pulse ? 'text-[#4ade80]' : 'text-white'}`}>
                {formatXOF(statsDisplay.totalValue)}
              </p>
            </div>

            {/* Taux de Succès */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Taux de Succès</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-white scale-105' : 'text-[#4ade80]'}`}>
                {statsDisplay.successRate.toFixed(1)}%
              </p>
            </div>

            {/* Dernière MAJ */}
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

        {/* Filters */}
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
              <option value="FLAGGED">Signalé</option>
            </select>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500">
              <option value="">Tous les types</option>
              {Object.entries(typeLabel).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction trouvée</p>
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
                          {/* Barre latérale d'activité */}
                          <td className="relative px-6 py-4 font-medium text-gray-800 dark:text-white">
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#00853F] rounded-r-full" />
                            )}
                            {typeLabel[tx.transaction_type] || tx.transaction_type}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{tx.sender_phone || '—'}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{tx.recipient_phone || '—'}</td>
                          <td className={`px-6 py-4 text-right font-semibold transition-colors duration-500 ${
                            isActive ? 'text-[#00853F] dark:text-[#4ade80]' : 'text-gray-800 dark:text-white'
                          }`}>{formatXOF(tx.amount)}</td>
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
              {/* Pagination */}
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
    </div>
  );
}
