'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, TrendingUp, ArrowUpRight, Download, BarChart2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { exportPDF } from '@/lib/export';
import type { RegionData } from '@/components/SenegalMap';

// Import dynamique OBLIGATOIRE — Leaflet nécessite le DOM (pas de SSR)
const SenegalMap = dynamic(() => import('@/components/SenegalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-green-50">
      <div className="flex flex-col items-center gap-3 text-green-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        <span className="text-sm">Chargement de la carte…</span>
      </div>
    </div>
  ),
});

// ─── Données fiscales des 14 régions ────────────────────────────────────────
const REGIONS: RegionData[] = [
  { name: 'Dakar',       abbr: 'Dak', lat: 14.693, lng: -17.447, recettes: 45200000000, volume: 345700, valeurMoy: 130800, tva: 8136000000,  croissance: 5.2, level: 'high'   },
  { name: 'Thiès',       abbr: 'Thi', lat: 14.791, lng: -16.926, recettes: 12800000000, volume: 89500,  valeurMoy: 143000, tva: 2304000000,  croissance: 3.8, level: 'medium' },
  { name: 'Diourbel',    abbr: 'Dio', lat: 14.655, lng: -16.231, recettes: 4200000000,  volume: 28700,  valeurMoy: 146300, tva: 756000000,   croissance: 1.9, level: 'low'    },
  { name: 'Saint-Louis', abbr: 'StL', lat: 16.018, lng: -15.980, recettes: 8900000000,  volume: 56300,  valeurMoy: 158100, tva: 1602000000,  croissance: 2.1, level: 'medium' },
  { name: 'Louga',       abbr: 'Lga', lat: 15.617, lng: -16.225, recettes: 3800000000,  volume: 23400,  valeurMoy: 162400, tva: 684000000,   croissance: 2.7, level: 'low'    },
  { name: 'Matam',       abbr: 'Mat', lat: 15.659, lng: -13.255, recettes: 2200000000,  volume: 15100,  valeurMoy: 145700, tva: 396000000,   croissance: 2.9, level: 'low'    },
  { name: 'Fatick',      abbr: 'Fat', lat: 14.339, lng: -16.411, recettes: 2100000000,  volume: 14500,  valeurMoy: 144800, tva: 378000000,   croissance: 1.8, level: 'low'    },
  { name: 'Kaolack',     abbr: 'Klk', lat: 14.151, lng: -16.072, recettes: 6500000000,  volume: 42100,  valeurMoy: 154400, tva: 1170000000,  croissance: 4.5, level: 'medium' },
  { name: 'Kaffrine',    abbr: 'Kaf', lat: 14.106, lng: -15.551, recettes: 1800000000,  volume: 11200,  valeurMoy: 160700, tva: 324000000,   croissance: 2.3, level: 'low'    },
  { name: 'Tambacounda', abbr: 'Tba', lat: 13.771, lng: -13.677, recettes: 2900000000,  volume: 18200,  valeurMoy: 159300, tva: 522000000,   croissance: 3.2, level: 'low'    },
  { name: 'Kédougou',    abbr: 'Kéd', lat: 12.558, lng: -12.178, recettes: 900000000,   volume: 6100,   valeurMoy: 147500, tva: 162000000,   croissance: 4.1, level: 'low'    },
  { name: 'Kolda',       abbr: 'Kol', lat: 12.898, lng: -14.941, recettes: 1500000000,  volume: 9800,   valeurMoy: 153100, tva: 270000000,   croissance: 1.2, level: 'low'    },
  { name: 'Sédhiou',     abbr: 'Séd', lat: 12.704, lng: -15.557, recettes: 1200000000,  volume: 7900,   valeurMoy: 151900, tva: 216000000,   croissance: 1.7, level: 'low'    },
  { name: 'Ziguinchor',  abbr: 'Zig', lat: 12.565, lng: -16.272, recettes: 3400000000,  volume: 21800,  valeurMoy: 155900, tva: 612000000,   croissance: 1.5, level: 'low'    },
];

const LEVEL_COLOR = { high: '#1d4ed8', medium: '#00853F', low: '#93c5fd' };
const LEVEL_LABEL = { high: 'Élevé',   medium: 'Moyen',   low: 'Faible'  };
const LEVEL_BADGE = {
  high:   'bg-green-100 text-green-900',
  medium: 'bg-green-50 text-green-700',
  low:    'bg-slate-100 text-slate-500',
};

/* ─── computed totals ────────────────────────────────────────── */
const TOTAL_RECETTES   = REGIONS.reduce((s, r) => s + r.recettes, 0);
const TOTAL_VOLUME     = REGIONS.reduce((s, r) => s + r.volume, 0);
const TOTAL_TVA        = REGIONS.reduce((s, r) => s + r.tva, 0);
const TOP_REGION       = [...REGIONS].sort((a, b) => b.recettes - a.recettes)[0];

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}
function formatVolume(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function CarteFiscalePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<RegionData | null>(null);
  const [viewType, setViewType] = useState<'Recettes' | 'Volume' | 'TVA'>('Recettes');

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div data-export>

      {/* ── dark banner ── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-xl">

          {/* top bar — title + view selector + actions */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            {/* left: title */}
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Cartographie Fiscale Interactive</h1>
              <p className="text-slate-400 text-xs mt-0.5">Sénégal · {REGIONS.length} régions</p>
            </div>
            {/* center: view type selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(['Recettes', 'Volume', 'TVA'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    viewType === v
                      ? 'bg-[#00853F] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {/* right: actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportPDF('Cartographie Fiscale')}
                className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Download className="h-3.5 w-3.5" /> Exporter
              </button>
            </div>
          </div>

          {/* metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Recettes Totales</p>
              <p className="text-lg font-bold text-white">{formatXOF(TOTAL_RECETTES)}</p>
              <p className="text-[#4ade80] text-xs mt-1">14 régions cumulées</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Transactions Totales</p>
              <p className="text-lg font-bold text-white">{formatVolume(TOTAL_VOLUME)}</p>
              <p className="text-[#4ade80] text-xs mt-1">Volume national</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">TVA Nationale</p>
              <p className="text-lg font-bold text-white">{formatXOF(TOTAL_TVA)}</p>
              <p className="text-[#4ade80] text-xs mt-1">18% sur recettes</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Région Phare</p>
              <p className="text-lg font-bold text-white flex items-center gap-1">
                <BarChart2 className="h-4 w-4 text-[#4ade80]" />
                {TOP_REGION.name}
              </p>
              <p className="text-amber-400 text-xs mt-1">+{TOP_REGION.croissance}% croissance</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── content ── */}
      <div className="px-4 sm:px-6 pb-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Carte Leaflet */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-800 dark:text-white">Carte du Sénégal — {viewType}</h2>
              <div className="flex items-center gap-4 text-xs">
                {(['high', 'medium', 'low'] as const).map(l => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: LEVEL_COLOR[l] }} />
                    <span className="text-gray-500 dark:text-slate-400">{LEVEL_LABEL[l]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 480 }}>
              <SenegalMap
                regions={REGIONS}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          </div>

          {/* Panel détails */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Détails de la région</h2>
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: LEVEL_COLOR[selected.level] }}
                  >
                    {selected.abbr}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_BADGE[selected.level]}`}>
                      {LEVEL_LABEL[selected.level]}
                    </span>
                  </div>
                </div>
                <DetailRow label="Recettes"     value={formatXOF(selected.recettes)} />
                <DetailRow label="Volume Trans." value={formatVolume(selected.volume)} />
                <DetailRow label="Valeur Moy."  value={formatXOF(selected.valeurMoy)} />
                <DetailRow label="TVA (18%)"    value={formatXOF(selected.tva)} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Croissance</span>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +{selected.croissance}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-slate-500">
                <MapPin className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm text-center">Cliquez sur un marqueur de la carte pour voir les détails fiscaux</p>
              </div>
            )}
          </div>
        </div>

        {/* Tableau comparatif */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-800 dark:text-white">Comparaison Régionale Détaillée</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  {['Région', 'Recettes', 'Volume Trans.', 'Valeur Moy.', 'TVA (18%)', 'Croissance'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase ${i === 0 ? 'text-left' : 'text-right'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {[...REGIONS].sort((a, b) => b.recettes - a.recettes).map(r => (
                  <tr
                    key={r.name}
                    className={`hover:bg-green-50 dark:hover:bg-[#00853F]/5 cursor-pointer transition-colors ${selected?.name === r.name ? 'bg-green-50 dark:bg-[#00853F]/10' : ''}`}
                    onClick={() => setSelected(selected?.name === r.name ? null : r)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: LEVEL_COLOR[r.level] }} />
                        <span className="font-medium text-gray-800 dark:text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">{formatXOF(r.recettes)}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">{formatVolume(r.volume)}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">{formatXOF(r.valeurMoy)}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">{formatXOF(r.tva)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-700 dark:text-green-400 font-medium flex items-center justify-end gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +{r.croissance}%
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800">
      <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
