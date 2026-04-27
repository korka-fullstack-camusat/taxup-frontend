'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, Filter, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

/* ── Static operator data (17 operators, 4 sectors) ─────────────────────── */
interface OperatorRow {
  name: string;
  sector: 'Mobile Money' | 'E-commerce' | 'Jeux en ligne' | 'Services digitaux';
  volume: number;   // nombre de transactions
  valeur: number;   // F CFA
  evolution: number; // % quotidien
  color: string;    // avatar bg
  initials: string;
}

const OPERATORS: OperatorRow[] = [
  /* Mobile Money */
  { name: 'Orange Money',    sector: 'Mobile Money',      volume: 245_700, valeur: 12_450_000_000,  evolution:  2.5, color: '#F97316', initials: 'OM' },
  { name: 'Wave',            sector: 'Mobile Money',      volume: 189_300, valeur:  8_920_000_000,  evolution:  4.2, color: '#0EA5E9', initials: 'WV' },
  { name: 'Free Money',      sector: 'Mobile Money',      volume:  67_900, valeur:  2_340_000_000,  evolution:  1.8, color: '#3B82F6', initials: 'FM' },
  { name: 'E-money',         sector: 'Mobile Money',      volume:  45_200, valeur:  1_890_000_000,  evolution: -0.5, color: '#6366F1', initials: 'EM' },
  { name: 'Kpay',            sector: 'Mobile Money',      volume:  23_400, valeur:    890_000_000,  evolution:  3.1, color: '#8B5CF6', initials: 'KP' },
  /* E-commerce */
  { name: 'Jumia',           sector: 'E-commerce',        volume: 156_800, valeur:  7_890_000_000,  evolution:  3.4, color: '#F59E0B', initials: 'JM' },
  { name: 'Expat-Dakar',     sector: 'E-commerce',        volume:  34_600, valeur:  1_450_000_000,  evolution:  1.9, color: '#10B981', initials: 'ED' },
  { name: 'Boutik 22',       sector: 'E-commerce',        volume:  28_900, valeur:    980_000_000,  evolution:  2.1, color: '#EF4444', initials: 'B2' },
  { name: 'E-KomKom',        sector: 'E-commerce',        volume:  19_900, valeur:    670_000_000,  evolution:  1.2, color: '#A855F7', initials: 'EK' },
  { name: 'Sodishop',        sector: 'E-commerce',        volume:  15_400, valeur:    520_000_000,  evolution:  0.8, color: '#14B8A6', initials: 'SS' },
  /* Jeux en ligne */
  { name: '1xBet',           sector: 'Jeux en ligne',     volume:  98_200, valeur:  5_120_000_000,  evolution:  5.6, color: '#DC2626', initials: '1X' },
  { name: 'Betway',          sector: 'Jeux en ligne',     volume:  72_400, valeur:  3_780_000_000,  evolution:  2.9, color: '#16A34A', initials: 'BW' },
  { name: 'PMU Sénégal',     sector: 'Jeux en ligne',     volume:  41_100, valeur:  2_140_000_000,  evolution: -1.2, color: '#2563EB', initials: 'PM' },
  { name: 'Loterie Nat.',    sector: 'Jeux en ligne',     volume:  18_600, valeur:    960_000_000,  evolution:  0.4, color: '#DB2777', initials: 'LN' },
  /* Services digitaux */
  { name: 'Senelec Digital', sector: 'Services digitaux', volume:  31_200, valeur:  1_680_000_000,  evolution:  1.1, color: '#0284C7', initials: 'SD' },
  { name: 'Orange Digital',  sector: 'Services digitaux', volume:  24_800, valeur:  1_290_000_000,  evolution:  0.9, color: '#EA580C', initials: 'OD' },
  { name: 'InnoDigit',       sector: 'Services digitaux', volume:  11_300, valeur:    590_000_000,  evolution:  1.5, color: '#7C3AED', initials: 'ID' },
];

const SECTORS = ['Tous les secteurs', 'Mobile Money', 'E-commerce', 'Jeux en ligne', 'Services digitaux'] as const;
const PERIODS  = ['Quotidien', 'Hebdomadaire', 'Mensuel'] as const;

type Sector = typeof SECTORS[number];
type Period = typeof PERIODS[number];

const SECTOR_BADGE: Record<string, string> = {
  'Mobile Money':      'bg-blue-100 text-blue-700',
  'E-commerce':        'bg-indigo-50 text-indigo-600',
  'Jeux en ligne':     'bg-red-50 text-red-600',
  'Services digitaux': 'bg-teal-50 text-teal-700',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function fmtValeur(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
}

function fmtKPI(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B CFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

const PAGE_SIZE = 10;

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

/* ── Component ───────────────────────────────────────────────────────────── */
export default function OperateursPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [sector,     setSector]     = useState<Sector>('Tous les secteurs');
  const [period,     setPeriod]     = useState<Period>('Quotidien');
  const [sectorOpen, setSectorOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  /* filtered list — reset page when sector changes */
  const filtered = sector === 'Tous les secteurs'
    ? OPERATORS
    : OPERATORS.filter(o => o.sector === sector);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* KPI totals */
  const totalOps   = OPERATORS.length;
  const totalVol   = OPERATORS.reduce((s, o) => s + o.volume, 0);
  const totalVal   = OPERATORS.reduce((s, o) => s + o.valeur, 0);
  const activeSect = new Set(OPERATORS.map(o => o.sector)).size;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Dark banner ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Gestion des Opérateurs</h1>
              <p className="text-slate-400 text-xs mt-0.5">Suivi des opérateurs digitaux et leurs performances</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Sector filter */}
              <div className="relative">
                <button
                  onClick={() => { setSectorOpen(o => !o); setPeriodOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
                >
                  <Filter className="h-3 w-3 text-slate-400" />
                  {sector === 'Tous les secteurs' ? 'Secteur' : sector}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
                {sectorOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[180px]">
                    {SECTORS.map(s => (
                      <button
                        key={s}
                        onClick={() => { setSector(s); setSectorOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sector === s ? 'text-[#00853F] font-medium' : 'text-gray-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Period filter */}
              <div className="relative">
                <button
                  onClick={() => { setPeriodOpen(o => !o); setSectorOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
                >
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {period}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
                {periodOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 min-w-[150px]">
                    {PERIODS.map(p => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setPeriodOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${period === p ? 'text-[#00853F] font-medium' : 'text-gray-700'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Total Opérateurs</p>
              <p className="text-lg font-bold text-white">{totalOps}</p>
              <p className="text-[#4ade80] text-xs mt-1">Tous actifs</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Volume Total</p>
              <p className="text-lg font-bold text-white">{fmtKPI(totalVol)}</p>
              <p className="text-slate-500 text-xs mt-1">Transactions</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Valeur Totale</p>
              <p className="text-lg font-bold text-white">{fmtKPI(totalVal)}</p>
              <p className="text-slate-500 text-xs mt-1">F CFA cumulés</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Secteurs Actifs</p>
              <p className="text-lg font-bold text-white">{activeSect}</p>
              <p className="text-slate-500 text-xs mt-1">Secteurs couverts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6 space-y-5">

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            {sector === 'Tous les secteurs' ? 'Tous les Opérateurs' : `Opérateurs — ${sector}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Opérateur</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Secteur</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Volume Transactions</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Valeur Transactions</th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Évolution ({period})
                </th>
                <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(op => (
                <tr key={op.name} className="hover:bg-gray-50 transition-colors">
                  {/* Opérateur */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: op.color }}
                      >
                        {op.initials}
                      </div>
                      <span className="font-medium text-gray-900">{op.name}</span>
                    </div>
                  </td>

                  {/* Secteur */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SECTOR_BADGE[op.sector]}`}>
                      {op.sector}
                    </span>
                  </td>

                  {/* Volume */}
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {fmtVolume(op.volume)}
                  </td>

                  {/* Valeur */}
                  <td className="px-6 py-4 text-gray-700">
                    {fmtValeur(op.valeur)}
                  </td>

                  {/* Évolution */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${op.evolution >= 0 ? 'text-[#00853F]' : 'text-red-500'}`}>
                      {op.evolution >= 0
                        ? <ArrowUpRight className="h-3.5 w-3.5" />
                        : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {op.evolution >= 0 ? '+' : ''}{op.evolution}%
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                      Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </div>
    </div>
  );
}

