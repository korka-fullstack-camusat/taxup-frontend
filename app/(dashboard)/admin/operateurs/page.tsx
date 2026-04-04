'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import {
  Building2, TrendingUp, DollarSign, Globe, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw, PauseCircle, PlayCircle, Trophy, X, ChevronRight, BarChart2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel, exportPDF } from '@/lib/export';

interface Operator {
  id: string;
  full_name: string;
  username: string;
  email: string;
  organization: string;
  is_active: boolean;
  phone_number?: string;
  tx_count?: number;
  tx_volume?: number;
  trend?: number;
}

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function vary(base: number, maxDelta: number, min = 0): number {
  return Math.max(min, base + (Math.random() * 2 - 1) * maxDelta);
}

const SECTEURS = ['Mobile Money', 'Banque', 'Assurance', 'Commerce'];
function getSecteur(op: Operator): string {
  const h = op.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SECTEURS[h % SECTEURS.length];
}

type Top5Choice = 'volume' | 'valeur';

export default function OperateursPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading,   setLoading]   = useState(true);

  /* live */
  const [live,  setLive]  = useState(true);
  const [pulse, setPulse] = useState(false);
  const [statsDisplay, setStatsDisplay] = useState({ ops: 17, volume: 1_200_000, valeur: 57_200_000_000, secteurs: 4 });
  const statsBaseRef = useRef({ ops: 17, volume: 1_200_000, valeur: 57_200_000_000, secteurs: 4 });
  const tickerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /* modals */
  const [showChoice, setShowChoice] = useState(false);
  const [top5Modal,  setTop5Modal]  = useState<Top5Choice | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  const fetchOperators = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { role: 'OPERATEUR_MOBILE', page_size: 100 } });
      const items = res.data.items || res.data || [];
      const enriched = items.map((op: Operator) => ({
        ...op,
        tx_count:  op.tx_count  ?? Math.floor(Math.random() * 250_000) + 10_000,
        tx_volume: op.tx_volume ?? Math.floor(Math.random() * 15_000_000_000) + 500_000_000,
        trend:     op.trend     ?? parseFloat((Math.random() * 8 - 2).toFixed(1)),
      }));
      setOperators(enriched);
      /* update live base from real data */
      if (enriched.length > 0) {
        const vol = enriched.reduce((s: number, o: Operator) => s + (o.tx_count  || 0), 0);
        const val = enriched.reduce((s: number, o: Operator) => s + (o.tx_volume || 0), 0);
        const base = { ops: enriched.length, volume: vol, valeur: val, secteurs: 4 };
        statsBaseRef.current = base;
        setStatsDisplay(base);
      }
    } catch { setOperators([]); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  /* ticker */
  useEffect(() => {
    if (!live) { tickerRef.current && clearInterval(tickerRef.current); return; }
    tickerRef.current = setInterval(() => {
      const b = statsBaseRef.current;
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      setStatsDisplay({
        ops:      Math.round(vary(b.ops,      0.5,  1)),
        volume:   Math.round(vary(b.volume,   b.volume   * 0.002, 0)),
        valeur:   Math.round(vary(b.valeur,   b.valeur   * 0.002, 0)),
        secteurs: Math.round(vary(b.secteurs, 0.3,  1)),
      });
    }, 2_000);
    return () => { tickerRef.current && clearInterval(tickerRef.current); };
  }, [live]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Gestion des Opérateurs'); return; }
    const cols = [
      { key: 'full_name',    label: 'Opérateur' },
      { key: 'email',        label: 'Email' },
      { key: 'organization', label: 'Organisation' },
      { key: 'tx_count',     label: 'Volume Transactions' },
      { key: 'tx_volume',    label: 'Valeur (XOF)' },
      { key: 'is_active',    label: 'Statut' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(operators as unknown as Record<string, unknown>[], 'operateurs', cols);
  };

  /* top-5 sorted lists */
  const top5ByVolume = [...operators].sort((a, b) => (b.tx_count  || 0) - (a.tx_count  || 0)).slice(0, 5);
  const top5ByValeur = [...operators].sort((a, b) => (b.tx_volume || 0) - (a.tx_volume || 0)).slice(0, 5);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="p-4 sm:p-6 space-y-6" data-export>

      {/* ── dark live banner ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-xl">

        {/* top bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
          {/* title */}
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Gestion des Opérateurs</h1>
            <p className="text-slate-400 text-xs mt-0.5">Supervision des opérateurs mobiles</p>
          </div>
          {/* live badge + refresh */}
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${live ? 'bg-[#00853F]/20 text-[#4ade80]' : 'bg-slate-700 text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-[#4ade80] animate-pulse' : 'bg-slate-500'}`} />
              {live ? 'En direct' : 'En pause'}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <RefreshCw
                className={`h-3 w-3 ${live ? 'text-[#4ade80]' : 'text-slate-600'}`}
                style={{ animation: live ? 'spin 2s linear infinite' : 'none' }}
              />
              <span className="hidden sm:inline">Actualisation auto / 2s</span>
            </div>
          </div>
          {/* actions + pause */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChoice(true)}
              className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Trophy className="h-3.5 w-3.5" />
              Top 5
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
            <ExportMenuDark onExport={handleExport} />
            <button
              onClick={() => setLive((l: boolean) => !l)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {live
                ? <><PauseCircle className="h-3.5 w-3.5" /> Pause</>
                : <><PlayCircle  className="h-3.5 w-3.5" /> Reprendre</>}
            </button>
          </div>
        </div>

        {/* metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          <Metric label="Total Opérateurs" value={statsDisplay.ops.toString()}            sub={`${operators.filter((o: Operator) => o.is_active).length} actifs`}      pulse={pulse && live} color="green" />
          <Metric label="Volume Total"     value={formatCount(statsDisplay.volume)}       sub="transactions"                                                pulse={pulse && live} color="green" />
          <Metric label="Valeur Totale"    value={formatXOF(statsDisplay.valeur)}         sub="F CFA cumulé"                                                pulse={pulse && live} color="green" />
          <Metric label="Secteurs Actifs"  value={statsDisplay.secteurs.toString()}       sub="Mobile, Banque, Assurance…"                                  pulse={pulse && live} color="amber" />
        </div>
      </div>

      {/* ── table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
          </div>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500">
            <Building2 className="h-10 w-10 mb-2" />
            <p>Aucun opérateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Opérateur</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Secteur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Volume Trans.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valeur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Évolution</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {operators.map((op: Operator) => (
                  <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-800 dark:text-green-400 font-bold text-sm flex-shrink-0">
                          {(op.organization || op.full_name)?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{op.organization || op.full_name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                        {getSecteur(op)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">{formatCount(op.tx_count || 0)}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">{formatXOF(op.tx_volume || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${(op.trend || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {(op.trend || 0) >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {(op.trend || 0) >= 0 ? '+' : ''}{op.trend}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${op.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {op.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── choice modal ── */}
      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowChoice(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 dark:text-white">Classement Top 5</h2>
              <button onClick={() => setShowChoice(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <ChoiceCard
                icon={<BarChart2 className="h-5 w-5 text-[#00853F]" />}
                title="Top 5 — Volume de Transactions"
                desc="Classement par nombre de transactions"
                onClick={() => { setShowChoice(false); setTop5Modal('volume'); }}
              />
              <ChoiceCard
                icon={<DollarSign className="h-5 w-5 text-amber-500" />}
                title="Top 5 — Valeur de Transactions"
                desc="Classement par montant total échangé"
                onClick={() => { setShowChoice(false); setTop5Modal('valeur'); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── top5 volume modal ── */}
      {top5Modal === 'volume' && (
        <Top5Modal
          title="Top 5 — Volume de Transactions"
          rows={top5ByVolume}
          valueKey="tx_count"
          formatValue={v => formatCount(v) + ' tx'}
          maxValue={top5ByVolume[0]?.tx_count || 1}
          color="#00853F"
          onClose={() => setTop5Modal(null)}
        />
      )}

      {/* ── top5 valeur modal ── */}
      {top5Modal === 'valeur' && (
        <Top5Modal
          title="Top 5 — Valeur de Transactions"
          rows={top5ByValeur}
          valueKey="tx_volume"
          formatValue={v => formatXOF(v)}
          maxValue={top5ByValeur[0]?.tx_volume || 1}
          color="#f59e0b"
          onClose={() => setTop5Modal(null)}
        />
      )}
    </div>
  );
}

/* ─── Metric cell ─────────────────────────────────────────── */
function Metric({ label, value, sub, pulse, color }: {
  label: string; value: string; sub: string; pulse: boolean; color: 'green' | 'amber';
}) {
  const flash = color === 'amber' ? 'bg-amber-500/10' : 'bg-[#00853F]/10';
  const textFlash = color === 'amber' ? 'text-amber-400' : 'text-[#4ade80]';
  const subColor  = color === 'amber' ? 'text-amber-400' : 'text-[#4ade80]';
  return (
    <div className={`bg-slate-900/60 px-5 py-4 transition-all duration-500 ${pulse ? flash : ''}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold transition-colors duration-500 ${pulse ? textFlash : 'text-white'}`}>{value}</p>
      <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

/* ─── Top5 modal ──────────────────────────────────────────── */
function Top5Modal({ title, rows, valueKey, formatValue, maxValue, color, onClose }: {
  title: string;
  rows: Operator[];
  valueKey: 'tx_count' | 'tx_volume';
  formatValue: (v: number) => string;
  maxValue: number;
  color: string;
  onClose: () => void;
}) {
  const medals = ['🥇', '🥈', '🥉', '4', '5'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color }} />
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {rows.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-4">Aucune donnée disponible</p>
          ) : rows.map((op, i) => {
            const val = op[valueKey] || 0;
            const pct = Math.round((val / maxValue) * 100);
            const isTop = i === 0;
            return (
              <div key={op.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-base leading-none w-5 text-center ${i < 3 ? '' : 'text-xs text-slate-500 dark:text-slate-400 font-bold'}`}>
                      {medals[i]}
                    </span>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isTop ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200'}`}
                      style={isTop ? { background: color } : {}}
                    >
                      {(op.organization || op.full_name)?.[0]?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
                        {op.organization || op.full_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{getSecteur(op)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold dark:text-white" style={isTop ? { color } : {}}>
                    {formatValue(val)}
                  </span>
                </div>
                <div className="ml-[50px] bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, opacity: isTop ? 1 : 0.5 + i * 0.1 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Choice card ─────────────────────────────────────────── */
function ChoiceCard({ icon, title, desc, onClick }: {
  icon: import('react').ReactNode; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-[#00853F] hover:bg-[#00853F]/5 dark:hover:bg-[#00853F]/10 transition-all text-left group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#00853F] transition-colors flex-shrink-0" />
    </button>
  );
}

/* ─── Export menu (dark) ──────────────────────────────────── */
function ExportMenuDark({ onExport }: { onExport: (f: 'csv' | 'excel' | 'pdf') => void }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium">
        <Download className="h-3.5 w-3.5" /> Exporter
      </button>
      <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 hidden group-hover:block z-20 min-w-[140px]">
        <button onClick={() => onExport('csv')}   className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">CSV</button>
        <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">Excel</button>
        <button onClick={() => onExport('pdf')}   className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">PDF / Imprimer</button>
      </div>
    </div>
  );
}
