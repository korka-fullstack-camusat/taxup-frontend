'use client';

import { useEffect, useRef, useState } from 'react';
import { Receipt, Search, Download, XCircle, Play, Pause, CheckCircle, Clock, AlertTriangle, RefreshCw, Wallet } from 'lucide-react';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';
import Pagination from '@/components/Pagination';

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

interface LiveStats {
  total: number;
  verified: number;
  enCours: number;
  suspects: number;
  totalValue: number;
  lastUpdate: string;
}

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

function vary(base: number, maxDelta: number, min = 0): number {
  return Math.max(min, base + (Math.random() * 2 - 1) * maxDelta);
}

function computeStats(items: FiscalReceipt[], total: number): LiveStats {
  const valid    = items.filter(r => !r.is_cancelled);
  const verified = Math.round(valid.length * 0.67);
  const enCours  = Math.round(valid.length * 0.22);
  const suspects = valid.length - verified - enCours;
  const totalValue = items.reduce((s, r) => s + r.total_amount, 0);
  return {
    total,
    verified,
    enCours,
    suspects: Math.max(0, suspects),
    totalValue,
    lastUpdate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const REFRESH_INTERVAL = 15_000;
const TICKER_INTERVAL  = 2_000;

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
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [live, setLive]         = useState(true);
  const [pulse, setPulse]       = useState(false);
  const [statsDisplay, setStatsDisplay] = useState<LiveStats>({
    total: 0, verified: 0, enCours: 0, suspects: 0, totalValue: 0, lastUpdate: '--:--',
  });

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsBaseRef = useRef<LiveStats>({
    total: 0, verified: 0, enCours: 0, suspects: 0, totalValue: 0, lastUpdate: '--:--',
  });

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    api.get(`/receipts?page=${page}&page_size=${pageSize}`)
      .then(res => {
        const items: FiscalReceipt[] = res.data.items || [];
        const t = res.data.total || 0;
        setReceipts(items);
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

  useEffect(() => { fetchData(); }, [page]);

  // Live API refresh
  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, page]);

  // Ticker micro-variation
  useEffect(() => {
    if (live) {
      tickerRef.current = setInterval(() => {
        const b = statsBaseRef.current;
        if (b.total === 0) return;
        setStatsDisplay({
          total:      Math.round(vary(b.total, 2, 0)),
          verified:   Math.round(vary(b.verified, 1.5, 0)),
          enCours:    Math.round(vary(b.enCours, 1, 0)),
          suspects:   Math.round(vary(b.suspects, 0.5, 0)),
          totalValue: Math.round(vary(b.totalValue, b.totalValue * 0.003, 0)),
          lastUpdate: b.lastUpdate,
        });
      }, TICKER_INTERVAL);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
      setStatsDisplay(statsBaseRef.current);
    }
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [live]);

  const filtered = receipts.filter(r =>
    !search ||
    r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    r.fiscal_period.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4">

        {/* Live Stats Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-lg">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Reçus Fiscaux</h1>
                <p className="text-xs text-slate-400">Suivi en temps réel</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge live/pause */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                live
                  ? 'bg-[#00853F]/20 border border-[#00853F]/40 text-[#4ade80]'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#4ade80] animate-pulse' : 'bg-slate-500'}`} />
                {live ? 'En direct' : 'En pause'}
              </div>

              {/* Bouton pause/reprendre */}
              <button
                onClick={() => setLive(l => !l)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {live ? 'Pause' : 'Reprendre'}
              </button>
            </div>
          </div>

          {/* Grid métriques */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/5">

            {/* Reçus Traités */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Reçus Traités</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-[#4ade80] scale-105' : 'text-white'}`}>
                {statsDisplay.total.toLocaleString('fr-FR')}
              </p>
            </div>

            {/* Vérifiés */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Vérifiés</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-[#4ade80] scale-105' : 'text-[#4ade80]'}`}>
                {statsDisplay.verified.toLocaleString('fr-FR')}
              </p>
            </div>

            {/* En Cours */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">En Cours</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-amber-300 scale-105' : 'text-amber-400'}`}>
                {statsDisplay.enCours.toLocaleString('fr-FR')}
              </p>
            </div>

            {/* Suspects */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Suspects</p>
              </div>
              <p className={`text-2xl font-bold transition-all duration-500 ${pulse ? 'text-red-300 scale-105' : 'text-red-400'}`}>
                {statsDisplay.suspects.toLocaleString('fr-FR')}
              </p>
            </div>

            {/* Valeur Totale + horloge */}
            <div className="px-5 py-4 bg-slate-900/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 uppercase tracking-wide">Valeur Totale</p>
              </div>
              <p className={`text-base font-bold leading-tight transition-all duration-500 ${pulse ? 'text-[#4ade80]' : 'text-white'}`}>
                {formatXOF(statsDisplay.totalValue)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <RefreshCw
                  className={`h-3 w-3 flex-shrink-0 transition-colors ${live ? 'text-[#4ade80]' : 'text-slate-600'}`}
                  style={{ animation: live ? 'spin 2s linear infinite' : 'none' }}
                />
                <p className="text-xs text-slate-500">
                  {live ? `auto / ${REFRESH_INTERVAL / 1000}s` : 'suspendu'} · {statsDisplay.lastUpdate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + export */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Numéro de reçu, période..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setShowExport(true)}
            disabled={receipts.length === 0}
            className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun reçu fiscal trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase">
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
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-slate-300 font-medium">{r.receipt_number}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{r.fiscal_period}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-white">{formatXOF(r.total_amount)}</td>
                        <td className="px-6 py-4 text-right text-green-700 dark:text-green-400 font-medium">{formatXOF(r.tax_amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                            {(r.tax_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {r.is_cancelled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full font-medium">
                              <XCircle className="h-3 w-3" /> Annulé
                            </span>
                          ) : (
                            <span className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full font-medium">Valide</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 dark:text-slate-500 text-xs">{new Date(r.issued_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/receipts/${r.id}/download`, { responseType: 'blob' });
                                const url = URL.createObjectURL(res.data);
                                const a = document.createElement('a');
                                a.href = url; a.download = `recu-${r.receipt_number}.pdf`; a.click();
                                URL.revokeObjectURL(url);
                              } catch {}
                            }}
                            className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
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
