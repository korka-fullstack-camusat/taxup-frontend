'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, TrendingUp, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel, exportPDF } from '@/lib/export';

/* ─── interfaces ────────────────────────────────────────────── */
interface FiscalReport {
  period: string;
  receipt_count: number;
  total_tax_xof: number;
  total_volume_xof: number;
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  tax_collected: number;
  fraud_alerts: number;
  new_users: number;
  receipts: number;
}

/* ─── static data ───────────────────────────────────────────── */
const SECTEURS = [
  { name: 'Mobile Money',      volume: 823, valeur: 589_750_000, tva: 106_155_000, moy: 716_586, color: '#00853F' },
  { name: 'E-commerce',        volume: 287, valeur: 195_525_000, tva:  35_194_500, moy: 681_272, color: '#3b82f6' },
  { name: 'Jeux en Ligne',     volume:  89, valeur:  71_400_000, tva:  12_852_000, moy: 802_247, color: '#f59e0b' },
  { name: 'Services Digitaux', volume:  48, valeur:  35_825_000, tva:   6_448_500, moy: 746_354, color: '#8b5cf6' },
];

const DAILY_DATA = [
  { date: '01/09', volume:  980, valeur: 712_000_000, tva: 128_160_000 },
  { date: '02/09', volume: 1050, valeur: 756_000_000, tva: 136_080_000 },
  { date: '03/09', volume: 1180, valeur: 834_000_000, tva: 150_120_000 },
  { date: '04/09', volume: 1090, valeur: 776_000_000, tva: 139_680_000 },
  { date: '05/09', volume: 1320, valeur: 948_000_000, tva: 170_640_000 },
  { date: '06/09', volume: 1150, valeur: 821_000_000, tva: 147_780_000 },
  { date: '07/09', volume: 1247, valeur: 892_500_000, tva: 160_650_000 },
];

const TOTAL_VOLUME = SECTEURS.reduce((s, x) => s + x.volume, 0);   // 1 247
const TOTAL_VALEUR = SECTEURS.reduce((s, x) => s + x.valeur, 0);   // 892 500 000
const TOTAL_TVA    = SECTEURS.reduce((s, x) => s + x.tva, 0);      // 160 650 000
const VALEUR_MOY   = Math.round(TOTAL_VALEUR / TOTAL_VOLUME);       // 715 847

/* ─── helpers ───────────────────────────────────────────────── */
function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

function fmtM(n: number) { return `${(n / 1_000_000).toFixed(0)}M`; }

/* ─── page ──────────────────────────────────────────────────── */
export default function RapportsPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [reports,   setReports]   = useState<FiscalReport[]>([]);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [period,    setPeriod]    = useState(30);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') fetchData();
  }, [user, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, eRes] = await Promise.allSettled([
        api.get('/dashboard/fiscal-reports'),
        api.get(`/dashboard/evolution?days=${period}`),
      ]);
      if (fRes.status === 'fulfilled') setReports(fRes.value.data.fiscal_reports || []);
      if (eRes.status === 'fulfilled') setEvolution(eRes.value.data.evolution || []);
    } finally { setLoading(false); }
  };

  const handleExportFiscal = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Rapports Fiscaux'); return; }
    const cols = [
      { key: 'period',           label: 'Période' },
      { key: 'receipt_count',    label: 'Reçus' },
      { key: 'total_tax_xof',   label: 'TVA (XOF)' },
      { key: 'total_volume_xof', label: 'Volume (XOF)' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(reports as unknown as Record<string, unknown>[], 'rapports-fiscaux', cols);
  };

  const handleExportEvolution = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF("Rapport d'évolution"); return; }
    const cols = [
      { key: 'date',         label: 'Date' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'volume',       label: 'Volume (XOF)' },
      { key: 'tax_collected',label: 'TVA (XOF)' },
      { key: 'fraud_alerts', label: 'Alertes Fraude' },
      { key: 'new_users',    label: 'Nouveaux Utilisateurs' },
      { key: 'receipts',     label: 'Reçus' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(
      evolution as unknown as Record<string, unknown>[],
      `rapport-evolution-${period}j`, cols,
    );
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div data-export>

      {/* ── sticky dark banner ── */}
      <div className="sticky top-12 md:top-0 z-10 bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-xl">

          {/* top bar */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Rapports Fiscaux</h1>
              <p className="text-slate-400 text-xs mt-0.5">Générer et exporter les rapports de la plateforme</p>
            </div>
            {/* period selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    period === d ? 'bg-[#00853F] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}j
                </button>
              ))}
            </div>
            {/* export */}
            <ExportMenuDark onExport={handleExportFiscal} />
          </div>

          {/* metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Volume Transactions</p>
              <p className="text-lg font-bold text-white">{TOTAL_VOLUME.toLocaleString('fr-FR')}</p>
              <p className="text-[#4ade80] text-xs mt-1">Nombre total</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Valeur Totale</p>
              <p className="text-lg font-bold text-white">{formatXOF(TOTAL_VALEUR)}</p>
              <p className="text-[#4ade80] text-xs mt-1">Montant brut</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">TVA Collectée (18%)</p>
              <p className="text-lg font-bold text-white">{formatXOF(TOTAL_TVA)}</p>
              <p className="text-[#4ade80] text-xs mt-1">Taxe sur valeur ajoutée</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Valeur Moyenne</p>
              <p className="text-lg font-bold text-white">{formatXOF(VALEUR_MOY)}</p>
              <p className="text-amber-400 text-xs mt-1">Par transaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── content ── */}
      <div className="px-4 sm:px-6 pb-6 space-y-6">

        {/* ── charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Évolution Volume vs Valeur */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Évolution Volume vs Valeur</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Rapport Quotidien</p>
              </div>
              <TrendingUp className="h-4 w-4 text-[#00853F]" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DAILY_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00853F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00853F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 10 }} tickFormatter={v => String(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={fmtM} />
                <Tooltip formatter={(v: number, name: string) =>
                  name === 'Volume' ? [v.toLocaleString('fr-FR'), 'Volume'] : [formatXOF(v), 'Valeur']
                } />
                <Legend />
                <Area yAxisId="left"  type="monotone" dataKey="volume" name="Volume" stroke="#00853F" fill="url(#gradVol)" strokeWidth={2} dot={false} />
                <Area yAxisId="right" type="monotone" dataKey="valeur" name="Valeur" stroke="#3b82f6" fill="url(#gradVal)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Collecte TVA */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Collecte TVA (18%)</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Rapport Quotidien</p>
              </div>
              <BarChart2 className="h-4 w-4 text-amber-500" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DAILY_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtM} />
                <Tooltip formatter={(v: number) => [formatXOF(v), 'TVA collectée']} />
                <Bar dataKey="tva" name="TVA" radius={[4, 4, 0, 0]} fill="#00853F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Répartition par secteur ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white text-sm">Répartition par Secteur</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">2024-09-07</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Secteur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Volume</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valeur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">TVA (18%)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Moy/Trans.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {SECTEURS.map(s => {
                  const pct = Math.round((s.valeur / TOTAL_VALEUR) * 100);
                  return (
                    <tr key={s.name} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="font-medium text-gray-800 dark:text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">
                        {s.volume.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">
                        {formatXOF(s.valeur)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#00853F] dark:text-[#4ade80]">
                        {formatXOF(s.tva)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-slate-300">
                        {formatXOF(s.moy)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-slate-800/50 border-t-2 border-gray-200 dark:border-slate-600">
                <tr>
                  <td className="px-6 py-3 text-xs font-bold text-gray-700 dark:text-slate-200 uppercase">Total</td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-gray-800 dark:text-white">{TOTAL_VOLUME.toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-gray-800 dark:text-white">{formatXOF(TOTAL_VALEUR)}</td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-[#00853F] dark:text-[#4ade80]">{formatXOF(TOTAL_TVA)}</td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-gray-800 dark:text-white">{formatXOF(VALEUR_MOY)}</td>
                  <td className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-slate-200">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── evolution from API ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
          </div>
        ) : (
          <>
            {evolution.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-700" />
                    Rapport d&apos;évolution quotidienne
                  </h2>
                  <ExportMenu onExport={handleExportEvolution} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left   text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Date</th>
                        <th className="px-6 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Transactions</th>
                        <th className="px-6 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Volume</th>
                        <th className="px-6 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">TVA</th>
                        <th className="px-6 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Alertes</th>
                        <th className="px-6 py-3 text-right  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Reçus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                      {evolution.map(d => (
                        <tr key={d.date} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">{d.date}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{d.transactions}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{formatXOF(d.volume)}</td>
                          <td className="px-6 py-3 text-right font-medium text-green-700 dark:text-[#4ade80]">{formatXOF(d.tax_collected)}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{d.fraud_alerts}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{d.receipts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reports.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-700" />
                    Rapports par période fiscale
                  </h2>
                  <ExportMenu onExport={handleExportFiscal} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left  text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Période</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Reçus</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">TVA Collectée</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Volume Total</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                      {reports.map(r => (
                        <tr key={r.period} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">{r.period}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{r.receipt_count.toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-3 text-right font-medium text-green-700 dark:text-[#4ade80]">{formatXOF(r.total_tax_xof)}</td>
                          <td className="px-6 py-3 text-right text-gray-600 dark:text-slate-300">{formatXOF(r.total_volume_xof)}</td>
                          <td className="px-6 py-3 text-right text-gray-500 dark:text-slate-400">
                            {r.total_volume_xof > 0 ? ((r.total_tax_xof / r.total_volume_xof) * 100).toFixed(1) : '0.0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Export menu (dark banner) ──────────────────────────────── */
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

/* ─── Export menu (light) ────────────────────────────────────── */
function ExportMenu({ onExport }: { onExport: (f: 'csv' | 'excel' | 'pdf') => void }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
        <Download className="h-4 w-4" /> Exporter
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg py-1 hidden group-hover:block z-20 min-w-[130px]">
        <button onClick={() => onExport('csv')}   className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">CSV</button>
        <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">Excel</button>
        <button onClick={() => onExport('pdf')}   className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">PDF / Imprimer</button>
      </div>
    </div>
  );
}
