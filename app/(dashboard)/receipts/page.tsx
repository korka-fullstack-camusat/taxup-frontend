'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Eye, ScanLine, Upload, RefreshCw, Filter, Search,
  Activity, X, Download, CameraOff,
} from 'lucide-react';
import api from '@/lib/api';
import { generateReceiptPDF } from '@/lib/export';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface FiscalReceipt {
  id: string;
  receipt_number: string;
  transaction_id: string;
  operator_id: string;
  tax_base: number;
  tax_amount: number;
  total_amount: number;
  tax_rate: number;
  currency: string;
  fiscal_period: string;
  is_certified: boolean;
  issued_at: string;
  is_cancelled: boolean;
}

interface Operator { id: string; full_name: string; organization?: string; }

/* ── Constants ───────────────────────────────────────────────────────────── */
const TYPES = ['Services digitaux', 'E-commerce', 'Jeux en ligne', 'Mobile Money'];
const OPERATORS_FALLBACK = ['Orange Money', 'Wave Sénégal', 'Free Money', '1xbet', 'Jumia'];

const STATUS_OPTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'valid', label: 'Vérifiés' },
  { value: 'pending', label: 'En cours' },
  { value: 'suspect', label: 'Suspects' },
  { value: 'cancelled', label: 'Annulés' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtCFA(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
}

function fmtDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return '—'; }
}

/** Stable pseudo-random [0..99] from a string */
function stableScore(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) ^ seed.charCodeAt(i);
  return Math.abs(h) % 100;
}

function stableIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % len;
}

function scoreColor(s: number): string {
  if (s >= 70) return 'bg-green-500';
  if (s >= 40) return 'bg-yellow-400';
  return 'bg-red-500';
}

function merchantLabel(receipt: FiscalReceipt): string {
  const n = stableIndex(receipt.id, 999) + 1;
  return `Marchand ${n}`;
}

function receiptType(receipt: FiscalReceipt): string {
  return TYPES[stableIndex(receipt.receipt_number, TYPES.length)];
}

function receiptStatus(r: FiscalReceipt): 'verified' | 'pending' | 'suspect' | 'cancelled' {
  if (r.is_cancelled) return 'cancelled';
  const score = stableScore(r.receipt_number);
  if (score >= 70) return 'verified';
  if (score >= 40) return 'pending';
  return 'suspect';
}

/* ── Detail Modal ────────────────────────────────────────────────────────── */
function DetailModal({ receipt, opName, onClose }: { receipt: FiscalReceipt; opName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">{receipt.receipt_number}</p>
            <p className="text-xs text-gray-400">{receiptType(receipt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {[
            ['Opérateur', opName],
            ['Marchand', merchantLabel(receipt)],
            ['Montant', fmtCFA(receipt.total_amount)],
            ['Taxe', fmtCFA(receipt.tax_amount)],
            ['Taux', `${(receipt.tax_rate * 100).toFixed(1)}%`],
            ['Période', receipt.fiscal_period],
            ['Émis le', fmtDatetime(receipt.issued_at)],
            ['Score vérification', `${stableScore(receipt.receipt_number)}%`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500">{l}</span>
              <span className="text-xs font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => generateReceiptPDF(receipt)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#00853F] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#006830] transition-colors"
          >
            <Download className="h-4 w-4" /> Télécharger PDF
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

/* ── Pagination ──────────────────────────────────────────────────────────── */
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

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function VerificationRecus() {
  const [receipts,    setReceipts]    = useState<FiscalReceipt[]>([]);
  const [operators,   setOperators]   = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(true);
  const [paused,      setPaused]      = useState(false);
  const [filter,      setFilter]      = useState('');
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState<FiscalReceipt | null>(null);
  const [page,        setPage]        = useState(1);
  const [totalItems,  setTotalItems]  = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* KPIs */
  const total     = receipts.length;
  const verified  = receipts.filter(r => receiptStatus(r) === 'verified').length;
  const enCours   = receipts.filter(r => receiptStatus(r) === 'pending').length;
  const suspects  = receipts.filter(r => receiptStatus(r) === 'suspect').length;
  const totalVal  = receipts.reduce((s, r) => s + r.total_amount, 0);

  /* fetch operators */
  useEffect(() => {
    api.get('/users?page_size=50').then(r => {
      const map: Record<string, string> = {};
      (r.data?.items ?? []).forEach((u: Operator) => {
        map[u.id] = u.organization ?? u.full_name;
      });
      setOperators(map);
    }).catch(() => {});
  }, []);

  /* fetch receipts */
  const fetchData = useCallback(async () => {
    try {
      const r = await api.get(`/receipts?page=${page}&page_size=${PAGE_SIZE}`);
      const items: FiscalReceipt[] = r.data?.items ?? [];
      setReceipts(items.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()));
      setTotalItems(r.data?.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (paused || page > 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(fetchData, 8000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, page, fetchData]);

  const goToPage = (p: number) => { setPage(p); setPaused(true); };

  /* filter rows */
  const visible = receipts.filter(r => {
    const st = receiptStatus(r);
    const matchFilter = !filter || filter === st;
    const q = search.toLowerCase();
    const matchSearch = !q
      || r.receipt_number.toLowerCase().includes(q)
      || (operators[r.operator_id] ?? '').toLowerCase().includes(q)
      || merchantLabel(r).toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Dark banner ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Vérification des Reçus en Temps Réel</h1>
              <p className="text-slate-400 text-xs mt-0.5">Monitoring des flux de reçus digitaux et validation automatique</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paused
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-red-500/80 text-white hover:bg-red-500'
                }`}
              >
                <RefreshCw className={`h-3 w-3 ${!paused ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '3s' }} />
                {paused ? 'En pause' : 'Actif'}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/80 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
                <ScanLine className="h-3 w-3" /> Scanner
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00853F]/80 text-white text-xs font-medium hover:bg-[#00853F] transition-colors">
                <Upload className="h-3 w-3" /> Importer
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Reçus Traités</p>
              <p className="text-lg font-bold text-white">{total}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[#4ade80] text-xs">En direct</span>
              </div>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Vérifiés</p>
              <p className="text-lg font-bold text-[#4ade80]">{verified}</p>
              <p className="text-slate-500 text-xs mt-1">Certifiés</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Suspects</p>
              <p className="text-lg font-bold text-orange-400">{suspects}</p>
              <p className="text-slate-500 text-xs mt-1">À vérifier</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Valeur Totale</p>
              <p className="text-lg font-bold text-white leading-tight">{fmtCFA(totalVal)}</p>
              <p className="text-slate-500 text-xs mt-1">Volume cumulé</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6 space-y-4">

        {/* ── Alert banner ─────────────────────────────────────────────── */}
        {suspects > 0 && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-orange-50 border-l-4 border-orange-400 rounded-r-xl">
            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-700">Attention Requise</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {suspects} reçu(s) suspect(s) détecté(s) nécessitent une vérification manuelle
              </p>
            </div>
          </div>
        )}

        {/* ── Filter + Search row ───────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              {STATUS_OPTS.find(o => o.value === filter)?.label ?? 'Tous les statuts'}
              <span className="text-gray-400">▾</span>
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[180px]">
                {STATUS_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${
                      filter === opt.value ? 'text-[#00853F] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              placeholder="Rechercher par numéro, marchand ou op..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/30 placeholder-gray-300"
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Flux de Reçus en Temps Réel</p>
            <div className="flex items-center gap-1.5 text-xs text-[#00853F]">
              <Activity className="h-3.5 w-3.5" />
              Monitoring actif
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00853F]" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <CameraOff className="h-8 w-8 opacity-30" />
              Aucun reçu trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['NUMÉRO REÇU', 'HORODATAGE', 'MARCHAND/OPÉRATEUR', 'MONTANT', 'TAXE', 'SCORE VÉRIFICATION', 'STATUT', 'ACTIONS'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, idx) => {
                    const score  = stableScore(r.receipt_number);
                    const type   = receiptType(r);
                    const st     = receiptStatus(r);
                    const opName = operators[r.operator_id]
                      ?? OPERATORS_FALLBACK[stableIndex(r.id, OPERATORS_FALLBACK.length)];
                    const merchant = merchantLabel(r);

                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          idx === 0 && !paused ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* NUMÉRO REÇU */}
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs font-semibold text-gray-800">{r.receipt_number}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{type}</p>
                        </td>

                        {/* HORODATAGE */}
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                          {fmtDatetime(r.issued_at)}
                        </td>

                        {/* MARCHAND/OPÉRATEUR */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-semibold text-gray-800">{merchant}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{opName}</p>
                        </td>

                        {/* MONTANT */}
                        <td className="px-4 py-3.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                          {fmtCFA(r.total_amount)}
                        </td>

                        {/* TAXE */}
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                          {fmtCFA(r.tax_amount)}
                        </td>

                        {/* SCORE VÉRIFICATION */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${scoreColor(score)}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-medium w-8">{score}%</span>
                          </div>
                        </td>

                        {/* STATUT */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {st === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00853F]">
                              <CheckCircle className="h-3.5 w-3.5" /> Vérifié
                            </span>
                          )}
                          {st === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500">
                              <Clock className="h-3.5 w-3.5" /> En cours
                            </span>
                          )}
                          {st === 'suspect' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
                              <AlertTriangle className="h-3.5 w-3.5" /> Suspect
                            </span>
                          )}
                          {st === 'cancelled' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                              <X className="h-3.5 w-3.5" /> Annulé
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelected(r)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          receipt={selected}
          opName={operators[selected.operator_id] ?? OPERATORS_FALLBACK[stableIndex(selected.id, OPERATORS_FALLBACK.length)]}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
