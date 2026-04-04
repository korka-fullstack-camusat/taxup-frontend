'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';
import {
  TrendingUp, Download, RefreshCw, PauseCircle, PlayCircle,
  BarChart2, ChevronRight, X, Target, Zap, Award
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { exportCSV, exportExcel, exportPDF } from '@/lib/export';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/* ─── helpers ─────────────────────────────────────────────── */
function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

function vary(base: number, maxDelta: number, min = 0): number {
  return Math.max(min, base + (Math.random() * 2 - 1) * maxDelta);
}

/* ─── static chart data ────────────────────────────────────── */
const MONTHLY_DATA = [
  { mois: 'Jan', recettes: 3_200, prevision: 3_100 },
  { mois: 'Fév', recettes: 3_500, prevision: 3_300 },
  { mois: 'Mar', recettes: 3_800, prevision: 3_600 },
  { mois: 'Avr', recettes: 3_600, prevision: 3_700 },
  { mois: 'Mai', recettes: 4_100, prevision: 3_900 },
  { mois: 'Jun', recettes: 4_300, prevision: 4_100 },
  { mois: 'Jul', recettes: 4_000, prevision: 4_200 },
  { mois: 'Aoû', recettes: 4_500, prevision: 4_300 },
  { mois: 'Sep', recettes: 4_700, prevision: 4_400 },
  { mois: 'Oct', recettes: 4_800, prevision: 4_500 },
  { mois: 'Nov', recettes: 4_600, prevision: 4_600 },
  { mois: 'Déc', recettes: 4_900, prevision: 4_800 },
];

const REGION_DATA = [
  { region: 'Dakar',     croissance: 22, recettes: 18_400 },
  { region: 'Thiès',    croissance: 15, recettes: 6_200 },
  { region: 'Saint-Louis', croissance: 11, recettes: 4_800 },
  { region: 'Ziguinchor', croissance: 9,  recettes: 3_100 },
  { region: 'Kaolack',  croissance: 8,  recettes: 3_400 },
  { region: 'Diourbel', croissance: 6,  recettes: 2_900 },
];

const TRIMESTRE_DATA = [
  { trimestre: 'Q1 2023', perf: 72 },
  { trimestre: 'Q2 2023', perf: 76 },
  { trimestre: 'Q3 2023', perf: 74 },
  { trimestre: 'Q4 2023', perf: 80 },
  { trimestre: 'Q1 2024', perf: 79 },
  { trimestre: 'Q2 2024', perf: 83 },
  { trimestre: 'Q3 2024', perf: 81 },
  { trimestre: 'Q4 2024', perf: 85 },
];

const SECTEUR_DATA = [
  { secteur: 'Commerce', efficacite: 88, subject: 'Commerce' },
  { secteur: 'Services',  efficacite: 84, subject: 'Services' },
  { secteur: 'Industrie', efficacite: 79, subject: 'Industrie' },
  { secteur: 'Agriculture', efficacite: 71, subject: 'Agriculture' },
  { secteur: 'BTP',       efficacite: 76, subject: 'BTP' },
  { secteur: 'Transport', efficacite: 82, subject: 'Transport' },
];

const REPARTITION_DATA = [
  { name: 'TVA',           value: 42, color: '#00853F' },
  { name: 'IS',            value: 28, color: '#FDEF42' },
  { name: 'IR',            value: 16, color: '#E31B23' },
  { name: 'Droits douane', value: 9,  color: '#3b82f6' },
  { name: 'Autres',        value: 5,  color: '#8b5cf6' },
];

/* ─── live stats base ──────────────────────────────────────── */
const STATS_BASE = {
  annuel:     45_600_000_000,
  mensuel:    4_800_000_000,
  efficacite: 82.5,
  objectif:   78,
};

interface LiveStats {
  annuel:     number;
  mensuel:    number;
  efficacite: number;
  objectif:   number;
}

/* ─── modal data ─────────────────────────────────────────────  */
type ModalChoice = 'top' | 'objectifs' | 'previsions';

export default function AnalyseRevenusPage() {
  const { user } = useAuth();
  const router    = useRouter();

  const [live,         setLive]         = useState(true);
  const [pulse,        setPulse]        = useState(false);
  const [stats,        setStats]        = useState<LiveStats>({ ...STATS_BASE });
  const statsBaseRef   = useRef<LiveStats>({ ...STATS_BASE });
  const tickerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  /* modals */
  const [showChoice,  setShowChoice]  = useState(false);
  const [choiceModal, setChoiceModal] = useState<ModalChoice | null>(null);

  /* export */
  const [reports, setReports] = useState<{ period: string; receipt_count: number; total_tax_xof: number; total_volume_xof: number }[]>([]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') {
      api.get('/dashboard/fiscal-reports').then((r: { data: { fiscal_reports?: typeof reports } }) => setReports(r.data.fiscal_reports || [])).catch(() => {});
    }
  }, [user]);

  /* ticker */
  useEffect(() => {
    if (!live) { tickerRef.current && clearInterval(tickerRef.current); return; }
    tickerRef.current = setInterval(() => {
      const b = statsBaseRef.current;
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      setStats({
        annuel:     Math.round(vary(b.annuel,     b.annuel     * 0.002, 0)),
        mensuel:    Math.round(vary(b.mensuel,    b.mensuel    * 0.003, 0)),
        efficacite: parseFloat(vary(b.efficacite, 0.3, 0).toFixed(1)),
        objectif:   parseFloat(vary(b.objectif,   0.5, 0).toFixed(1)),
      });
    }, 2_000);
    return () => { tickerRef.current && clearInterval(tickerRef.current); };
  }, [live]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Analyse des Revenus'); return; }
    const cols = [
      { key: 'period',           label: 'Période' },
      { key: 'receipt_count',    label: 'Nombre de reçus' },
      { key: 'total_tax_xof',    label: 'TVA Collectée (XOF)' },
      { key: 'total_volume_xof', label: 'Volume Total (XOF)' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(reports as unknown as Record<string, unknown>[], 'taxup-revenus', cols);
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div data-export>

      {/* ── sticky live banner ── */}
      <div className="sticky top-12 md:top-0 z-10 bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl overflow-hidden shadow-xl">
        {/* top bar — title + live controls + action buttons all in one row */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
          {/* left: title */}
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Analyse des Revenus</h1>
            <p className="text-slate-400 text-xs mt-0.5">Synthèse fiscale · Sénégal</p>
          </div>
          {/* center: live badge + refresh */}
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
          {/* right: action buttons + pause */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChoice(true)}
              className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Rapports
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

        {/* metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          {/* Recettes Annuelles */}
          <div className={`bg-slate-900/60 px-5 py-4 transition-all duration-500 ${pulse && live ? 'bg-[#00853F]/10' : ''}`}>
            <p className="text-slate-400 text-xs mb-1">Recettes Annuelles</p>
            <p className={`text-lg font-bold transition-colors duration-500 ${pulse && live ? 'text-[#4ade80]' : 'text-white'}`}>
              {formatXOF(stats.annuel)}
            </p>
            <p className="text-[#4ade80] text-xs mt-1">+18.7% vs 2023</p>
          </div>

          {/* Recettes Mensuelles */}
          <div className={`bg-slate-900/60 px-5 py-4 transition-all duration-500 ${pulse && live ? 'bg-[#00853F]/10' : ''}`}>
            <p className="text-slate-400 text-xs mb-1">Recettes Mensuelles</p>
            <p className={`text-lg font-bold transition-colors duration-500 ${pulse && live ? 'text-[#4ade80]' : 'text-white'}`}>
              {formatXOF(stats.mensuel)}
            </p>
            <p className="text-[#4ade80] text-xs mt-1">+4.3% vs mois dernier</p>
          </div>

          {/* Efficacité Fiscale */}
          <div className={`bg-slate-900/60 px-5 py-4 transition-all duration-500 ${pulse && live ? 'bg-[#00853F]/10' : ''}`}>
            <p className="text-slate-400 text-xs mb-1">Efficacité Fiscale</p>
            <p className={`text-lg font-bold transition-colors duration-500 ${pulse && live ? 'text-[#4ade80]' : 'text-white'}`}>
              {stats.efficacite.toFixed(1)}%
            </p>
            <p className="text-[#4ade80] text-xs mt-1">+2.1% ce trimestre</p>
          </div>

          {/* Objectif Annuel */}
          <div className={`bg-slate-900/60 px-5 py-4 transition-all duration-500 ${pulse && live ? 'bg-amber-500/10' : ''}`}>
            <p className="text-slate-400 text-xs mb-1">Objectif Annuel</p>
            <p className={`text-lg font-bold transition-colors duration-500 ${pulse && live ? 'text-amber-400' : 'text-white'}`}>
              {stats.objectif.toFixed(1)}%
            </p>
            <p className="text-amber-400 text-xs mt-1">En avance sur objectif</p>
          </div>
        </div>
      </div>
      </div>

      {/* ── charts section ── */}
      <div className="px-4 sm:px-6 pb-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Évolution Mensuelle */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Évolution Mensuelle des Recettes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRecettes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00853F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00853F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrevision" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FDEF42" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FDEF42" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#334155]" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}M`} />
              <Tooltip formatter={(v: number) => [`${v}M F CFA`, '']} />
              <Legend />
              <Area type="monotone" dataKey="recettes"  name="Recettes"  stroke="#00853F" fill="url(#gradRecettes)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="prevision" name="Prévision" stroke="#FDEF42" fill="url(#gradPrevision)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Croissance par Région */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Croissance par Région</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REGION_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="region" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Croissance']} />
              <Bar dataKey="croissance" name="Croissance" radius={[4, 4, 0, 0]}>
                {REGION_DATA.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#00853F' : i === 1 ? '#22c55e' : '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Performance Trimestrielle */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Performance Trimestrielle</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TRIMESTRE_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Performance']} />
              <Line
                type="monotone" dataKey="perf" name="Performance"
                stroke="#00853F" strokeWidth={2.5}
                dot={{ fill: '#00853F', r: 4 }}
                activeDot={{ r: 6 }}
              />
              {/* target line at 80% */}
              <Line
                type="monotone" dataKey={() => 80} name="Objectif"
                stroke="#FDEF42" strokeWidth={1.5} strokeDasharray="5 3" dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Efficacité Fiscale par Secteur */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Efficacité Fiscale par Secteur</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={SECTEUR_DATA} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar name="Efficacité" dataKey="efficacite" stroke="#00853F" fill="#00853F" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Efficacité']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Répartition des Recettes par Type — full width */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Répartition des Recettes par Type</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie
                data={REPARTITION_DATA}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {REPARTITION_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {REPARTITION_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-sm text-gray-700 dark:text-slate-300 flex-1">{d.name}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 max-w-[140px]">
                  <div className="h-2 rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white w-8 text-right">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── choice modal ── */}
      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowChoice(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 dark:text-white">Rapports & Analyses</h2>
              <button onClick={() => setShowChoice(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <ChoiceCard
                icon={<Award className="h-5 w-5 text-[#00853F]" />}
                title="Top Performances"
                desc="Meilleures régions et secteurs"
                onClick={() => { setShowChoice(false); setChoiceModal('top'); }}
              />
              <ChoiceCard
                icon={<Target className="h-5 w-5 text-amber-500" />}
                title="Objectifs"
                desc="Taux d'atteinte des objectifs fiscaux"
                onClick={() => { setShowChoice(false); setChoiceModal('objectifs'); }}
              />
              <ChoiceCard
                icon={<Zap className="h-5 w-5 text-blue-500" />}
                title="Prévisions"
                desc="Projections et estimations 2025"
                onClick={() => { setShowChoice(false); setChoiceModal('previsions'); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── detail modals ── */}
      {choiceModal === 'top' && (
        <DetailModal title="Top Performances" onClose={() => setChoiceModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Meilleures Régions</p>
            {REGION_DATA.slice(0, 4).map(r => (
              <div key={r.region}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-slate-200 font-medium">{r.region}</span>
                  <span className="text-[#00853F] font-bold">+{r.croissance}%</span>
                </div>
                <div className="bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#00853F]" style={{ width: `${(r.croissance / 25) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-3">Meilleures Secteurs</p>
              {SECTEUR_DATA.slice(0, 3).map(s => (
                <div key={s.secteur} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800">
                  <span className="text-sm text-gray-700 dark:text-slate-200">{s.secteur}</span>
                  <span className="text-sm font-bold text-[#4ade80] bg-[#00853F]/10 px-2 py-0.5 rounded-full">{s.efficacite}%</span>
                </div>
              ))}
            </div>
          </div>
        </DetailModal>
      )}

      {choiceModal === 'objectifs' && (
        <DetailModal title="Objectifs Fiscaux" onClose={() => setChoiceModal(null)}>
          <div className="space-y-5">
            {[
              { label: 'Recettes annuelles',  pct: 78, color: '#00853F', desc: '78% atteint' },
              { label: 'Efficacité fiscale',  pct: 92, color: '#3b82f6', desc: '92% atteint' },
              { label: 'Couverture digitale', pct: 85, color: '#8b5cf6', desc: '85% atteint' },
            ].map(o => (
              <div key={o.label}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{o.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{o.desc}</p>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: o.color }}>{o.pct}%</span>
                </div>
                <div className="bg-gray-100 dark:bg-slate-700 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${o.pct}%`, background: o.color }} />
                </div>
              </div>
            ))}
            <div className="mt-2 bg-[#00853F]/10 dark:bg-[#00853F]/20 rounded-xl p-3 text-center">
              <p className="text-[#00853F] dark:text-[#4ade80] text-xs font-medium">Tous les objectifs sont en bonne trajectoire</p>
            </div>
          </div>
        </DetailModal>
      )}

      {choiceModal === 'previsions' && (
        <DetailModal title="Prévisions 2025" onClose={() => setChoiceModal(null)}>
          <div className="space-y-4">
            {/* main forecast */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Recettes prévues 2025</p>
              <p className="text-white text-2xl font-bold">52 000 000 000 F CFA</p>
              <p className="text-[#4ade80] text-sm mt-1 font-medium">+14% croissance estimée</p>
            </div>

            {/* trimester alerts */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                <div>
                  <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">Q4 2024 — Période critique</p>
                  <p className="text-amber-600 dark:text-amber-500 text-xs mt-0.5">Surveillance renforcée</p>
                </div>
              </div>
            </div>

            {/* quarterly projections */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-3">Projections par trimestre</p>
              {[
                { q: 'Q1 2025', prev: '12 000 000 000', pct: '+11%' },
                { q: 'Q2 2025', prev: '13 500 000 000', pct: '+14%' },
                { q: 'Q3 2025', prev: '12 800 000 000', pct: '+13%' },
                { q: 'Q4 2025', prev: '13 700 000 000', pct: '+16%' },
              ].map(row => (
                <div key={row.q} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{row.q}</span>
                  <span className="text-sm text-gray-600 dark:text-slate-300">{row.prev} F CFA</span>
                  <span className="text-xs font-bold text-[#4ade80] bg-[#00853F]/10 px-2 py-0.5 rounded-full">{row.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </DetailModal>
      )}
      </div>
    </div>
  );
}

/* ─── sub-components ──────────────────────────────────────── */

function ChoiceCard({ icon, title, desc, onClick }: { icon: ReactNode; title: string; desc: string; onClick: () => void }) {
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

function DetailModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* Dark variant used inside the banner */
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
