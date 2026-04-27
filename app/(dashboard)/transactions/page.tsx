'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pause, Play, DollarSign, TrendingUp, RefreshCw,
  CheckCircle, AlertCircle, Clock, ChevronDown, AlertTriangle, Activity,
} from 'lucide-react';
import api from '@/lib/api';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Transaction {
  id: string;
  reference: string;
  operator_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  sender_phone: string;
  receiver_phone: string;
  sender_name?: string;
  receiver_name?: string;
  transaction_date: string;
  created_at: string;
  status: string;
}

interface Operator { id: string; full_name: string; organization?: string; }

/* ── Mappings ────────────────────────────────────────────────────────────── */
const TYPE_MAP: Record<string, { label: string; cls: string }> = {
  TRANSFERT:     { label: 'Mobile Money',      cls: 'bg-blue-100 text-blue-800' },
  DEPOT:         { label: 'Mobile Money',      cls: 'bg-blue-100 text-blue-800' },
  RETRAIT:       { label: 'Mobile Money',      cls: 'bg-blue-100 text-blue-800' },
  PAIEMENT:      { label: 'E-commerce',        cls: 'bg-sky-100 text-sky-700' },
  REMBOURSEMENT: { label: 'Services digitaux', cls: 'bg-teal-100 text-teal-700' },
};

const STATUS_MAP: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  COMPLETED:    { label: 'Succès',     cls: 'text-green-600', Icon: CheckCircle },
  FAILED:       { label: 'Échec',      cls: 'text-red-500',   Icon: AlertCircle },
  PENDING:      { label: 'En attente', cls: 'text-yellow-600', Icon: Clock },
  UNDER_REVIEW: { label: 'En revue',   cls: 'text-orange-500', Icon: Activity },
  CANCELLED:    { label: 'Annulé',     cls: 'text-gray-500',  Icon: AlertCircle },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Toutes les transactions' },
  { value: 'COMPLETED', label: 'Succès uniquement' },
  { value: 'FAILED', label: 'Échecs uniquement' },
  { value: 'PENDING', label: 'En attente' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '—'; }
}

function fmtCFA(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
}

function fmtPhone(phone?: string): string {
  if (!phone) return '—';
  return phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

const PAGE_SIZE = 20;

/* ── Pagination component ─────────────────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">{from}–{to} sur {total} résultats</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ← Préc.
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-2 text-xs text-gray-400">…</span>
            : <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                  p === page
                    ? 'bg-[#00853F] text-white font-semibold'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >{p}</button>
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Suiv. →
        </button>
      </div>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function SuiviTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [operators, setOperators]       = useState<Record<string, string>>({});
  const [paused, setPaused]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [lastUpdate, setLastUpdate]     = useState('—');
  const [page, setPage]                 = useState(1);
  const [totalItems, setTotalItems]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* derived KPIs */
  const total      = transactions.length;
  const totalValue = transactions.reduce((s, t) => s + t.amount, 0);
  const successes  = transactions.filter(t => t.status === 'COMPLETED').length;
  const failures   = transactions.filter(t => t.status === 'FAILED').length;
  const successRate = total > 0 ? ((successes / total) * 100).toFixed(1) : '0.0';

  /* visible rows after filter */
  const visible = statusFilter
    ? transactions.filter(t => t.status === statusFilter)
    : transactions;

  /* fetch operators once */
  useEffect(() => {
    api.get('/users?page_size=50').then(r => {
      const map: Record<string, string> = {};
      (r.data?.items ?? []).forEach((u: Operator) => {
        map[u.id] = u.organization ?? u.full_name;
      });
      setOperators(map);
    }).catch(() => {});
  }, []);

  /* fetch transactions */
  const fetchData = useCallback(async () => {
    try {
      const r = await api.get(`/transactions?page=${page}&page_size=${PAGE_SIZE}`);
      const items: Transaction[] = r.data?.items ?? [];
      setTransactions(items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      setTotalItems(r.data?.total ?? 0);
      setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  /* initial + polling — pause auto-refresh when not on page 1 */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (paused || page > 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(fetchData, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, page, fetchData]);

  const goToPage = (p: number) => { setPage(p); setPaused(true); };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Dark banner ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Suivi des Transactions en Temps Réel</h1>
              <p className="text-slate-400 text-xs mt-0.5">Monitoring des flux transactionnels digitaux</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paused
                    ? 'bg-[#00853F] text-white hover:bg-[#006d33]'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
                >
                  {FILTER_OPTIONS.find(o => o.value === statusFilter)?.label ?? 'Toutes'}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[200px]">
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          statusFilter === opt.value ? 'text-[#00853F] font-medium' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Transactions</p>
              <p className="text-lg font-bold text-white">{total}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[#4ade80] text-xs">En direct</span>
              </div>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Valeur Totale</p>
              <p className="text-lg font-bold text-white leading-tight">{fmtCFA(totalValue)}</p>
              <p className="text-slate-500 text-xs mt-1">Volume cumulé</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Taux de Succès</p>
              <p className="text-lg font-bold text-white">{successRate}%</p>
              <p className="text-[#4ade80] text-xs mt-1">{successes} complétées</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Dernière MAJ</p>
              <p className="text-lg font-bold text-white">{lastUpdate}</p>
              <p className="text-slate-500 text-xs mt-1">{paused ? 'En pause' : 'Rafraîchissement auto'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6 space-y-4">

        {/* ── Alert banner ─────────────────────────────────────────────── */}
        {failures > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Surveillance Active</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {failures} transaction{failures > 1 ? 's' : ''} échouée{failures > 1 ? 's' : ''} détectée{failures > 1 ? 's' : ''} dans les dernières minutes
              </p>
            </div>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">
              Flux Transactionnel —{' '}
              {FILTER_OPTIONS.find(o => o.value === statusFilter)?.label.replace('uniquement', '').trim() ?? 'Toutes'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Mis à jour en temps réel
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853F]" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Aucune transaction trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['HEURE', 'RÉFÉRENCE', 'OPÉRATEUR', 'TYPE', 'ÉMETTEUR', 'DESTINATAIRE', 'MONTANT', 'STATUT'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((tx, idx) => {
                    const type   = TYPE_MAP[tx.transaction_type]   ?? { label: tx.transaction_type, cls: 'bg-gray-100 text-gray-600' };
                    const status = STATUS_MAP[tx.status]            ?? { label: tx.status, cls: 'text-gray-500', Icon: Clock };
                    const StatusIcon = status.Icon;
                    const opName = operators[tx.operator_id] ?? 'Opérateur';
                    return (
                      <tr
                        key={tx.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          idx === 0 && !paused ? 'bg-green-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                          {fmtTime(tx.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-700 whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                          {opName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${type.cls}`}>
                            {type.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {tx.sender_name || fmtPhone(tx.sender_phone)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {tx.receiver_name || fmtPhone(tx.receiver_phone)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                          {fmtCFA(tx.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.cls}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} total={totalItems} pageSize={PAGE_SIZE} onChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
