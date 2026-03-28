'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Region {
  id: string;
  name: string;
  abbr: string;
  x: number;
  y: number;
  recettes: number;
  volume: number;
  valeurMoy: number;
  tva: number;
  croissance: number;
  level: 'high' | 'medium' | 'low';
}

const REGIONS: Region[] = [
  { id: 'dakar', name: 'Dakar', abbr: 'Dak', x: 52, y: 72, recettes: 45200000000, volume: 345700, valeurMoy: 130800, tva: 8136000000, croissance: 5.2, level: 'high' },
  { id: 'thies', name: 'Thi\u00e8s', abbr: 'Thi', x: 48, y: 68, recettes: 12800000000, volume: 89500, valeurMoy: 143000, tva: 2304000000, croissance: 3.8, level: 'medium' },
  { id: 'saint-louis', name: 'Saint-Louis', abbr: 'StL', x: 44, y: 32, recettes: 8900000000, volume: 56300, valeurMoy: 158100, tva: 1602000000, croissance: 2.1, level: 'medium' },
  { id: 'kaolack', name: 'Kaolack', abbr: 'Klk', x: 44, y: 62, recettes: 6500000000, volume: 42100, valeurMoy: 154400, tva: 1170000000, croissance: 4.5, level: 'medium' },
  { id: 'diourbel', name: 'Diourbel', abbr: 'Dio', x: 51, y: 58, recettes: 4200000000, volume: 28700, valeurMoy: 146300, tva: 756000000, croissance: 1.9, level: 'low' },
  { id: 'louga', name: 'Louga', abbr: 'Lga', x: 48, y: 42, recettes: 3800000000, volume: 23400, valeurMoy: 162400, tva: 684000000, croissance: 2.7, level: 'low' },
  { id: 'tambacounda', name: 'Tambacounda', abbr: 'Tba', x: 64, y: 52, recettes: 2900000000, volume: 18200, valeurMoy: 159300, tva: 522000000, croissance: 3.2, level: 'low' },
  { id: 'ziguinchor', name: 'Ziguinchor', abbr: 'Zig', x: 35, y: 76, recettes: 3400000000, volume: 21800, valeurMoy: 155900, tva: 612000000, croissance: 1.5, level: 'low' },
];

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function CarteFiscalePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [viewType, setViewType] = useState<'Recettes' | 'Volume' | 'TVA'>('Recettes');

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  const levelColor = { high: 'bg-emerald-500', medium: 'bg-yellow-500', low: 'bg-red-400' };
  const levelLabel = { high: '\u00c9lev\u00e9', medium: 'Moyen', low: 'Faible' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cartographie Fiscale Interactive - S\u00e9n\u00e9gal</h1>
        <select
          value={viewType}
          onChange={e => setViewType(e.target.value as typeof viewType)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option>Recettes</option>
          <option>Volume</option>
          <option>TVA</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Carte du S\u00e9n\u00e9gal - {viewType}</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-gray-500">\u00c9lev\u00e9</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-gray-500">Moyen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <span className="text-gray-500">Faible</span>
              </div>
            </div>
          </div>

          {/* SVG Map placeholder */}
          <div className="relative bg-blue-50 rounded-xl" style={{ height: 420, overflow: 'hidden' }}>
            {/* Water labels */}
            <span className="absolute text-sm text-blue-400 italic" style={{ left: '8%', top: '25%' }}>Oc\u00e9an Atlantique</span>
            {/* Country labels */}
            <span className="absolute text-xs text-gray-400" style={{ right: '5%', top: '15%' }}>Mauritanie</span>
            <span className="absolute text-xs text-gray-400" style={{ right: '5%', bottom: '10%' }}>Mali</span>
            <span className="absolute text-xs text-gray-400" style={{ left: '25%', bottom: '8%' }}>Guin\u00e9e-Bissau</span>
            <span className="absolute text-xs text-gray-400" style={{ left: '45%', bottom: '8%' }}>Guin\u00e9e</span>

            {/* Dashed border (simplified) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 30,15 C 45,10 70,12 85,20 C 90,35 88,55 85,70 C 75,85 55,90 40,88 C 28,85 20,78 18,65 C 15,50 20,30 30,15 Z"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            </svg>

            {/* Region pins */}
            {REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 z-10 ${
                  selectedRegion?.id === region.id ? 'scale-125' : ''
                }`}
                style={{ left: `${region.x}%`, top: `${region.y}%` }}
              >
                <div className={`h-10 w-10 rounded-full ${levelColor[region.level]} flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white`}>
                  {region.abbr}
                </div>
                <p className="text-xs text-gray-600 font-medium mt-1 text-center whitespace-nowrap">{region.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Details panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">S\u00e9lectionnez une r\u00e9gion</h2>
          {selectedRegion ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className={`h-12 w-12 rounded-xl ${levelColor[selectedRegion.level]} flex items-center justify-center text-white font-bold`}>
                  {selectedRegion.abbr}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedRegion.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    selectedRegion.level === 'high' ? 'bg-emerald-100 text-emerald-700' :
                    selectedRegion.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {levelLabel[selectedRegion.level]}
                  </span>
                </div>
              </div>

              <DetailRow label="Recettes" value={formatXOF(selectedRegion.recettes)} />
              <DetailRow label="Volume Trans." value={formatVolume(selectedRegion.volume)} />
              <DetailRow label="Valeur Moy." value={formatXOF(selectedRegion.valeurMoy)} />
              <DetailRow label="TVA (18%)" value={formatXOF(selectedRegion.tva)} />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Croissance</span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +{selectedRegion.croissance}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MapPin className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm text-center">Cliquez sur une r\u00e9gion de la carte pour voir les d\u00e9tails fiscaux</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Comparaison R\u00e9gionale D\u00e9taill\u00e9e</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">R\u00e9gion</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Recettes</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Trans.</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valeur Moy.</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TVA (18%)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Croissance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {REGIONS.sort((a, b) => b.recettes - a.recettes).map(r => (
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedRegion?.id === r.id ? 'bg-emerald-50' : ''}`}
                  onClick={() => setSelectedRegion(r)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${levelColor[r.level]}`} />
                      <span className="font-medium text-gray-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">{formatXOF(r.recettes)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{formatVolume(r.volume)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{formatXOF(r.valeurMoy)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{formatXOF(r.tva)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-600 font-medium flex items-center justify-end gap-1">
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
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
