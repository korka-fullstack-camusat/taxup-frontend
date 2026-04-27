'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtCFA(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
}
function fmtB(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  return String(n);
}

/* ── Static data ─────────────────────────────────────────────────────────── */
const MONTHLY_DATA = [
  { mois: 'Jan', recettes: 3_200_000_000 },
  { mois: 'Fév', recettes: 3_500_000_000 },
  { mois: 'Mar', recettes: 3_800_000_000 },
  { mois: 'Avr', recettes: 3_600_000_000 },
  { mois: 'Mai', recettes: 4_100_000_000 },
  { mois: 'Jun', recettes: 4_300_000_000 },
  { mois: 'Jul', recettes: 4_000_000_000 },
  { mois: 'Aoû', recettes: 4_500_000_000 },
  { mois: 'Sep', recettes: 4_700_000_000 },
];

const REGION_DATA = [
  { region: 'Louga',        croissance: 0.05 },
  { region: 'Diourbel',     croissance: 0.06 },
  { region: 'Tambacounda',  croissance: 0.28 },
  { region: 'Ziguinchor',   croissance: 0.09 },
  { region: 'Kaolack',      croissance: 0.08 },
  { region: 'Saint-Louis',  croissance: 0.11 },
  { region: 'Thiès',        croissance: 0.15 },
  { region: 'Dakar',        croissance: 0.22 },
];

const TRIMESTRE_DATA = [
  { trimestre: 'Q1 2024', volume: 10_200_000_000 },
  { trimestre: 'Q2 2024', volume: 10_800_000_000 },
  { trimestre: 'Q3 2024', volume: 11_200_000_000 },
  { trimestre: 'Q4 2024', volume: 11_800_000_000 },
];

const SECTEUR_RADAR = [
  { subject: 'Mobile Money',     efficacite: 85 },
  { subject: 'E-commerce',       efficacite: 72 },
  { subject: 'Services digitaux',efficacite: 68 },
  { subject: 'Jeux en ligne',    efficacite: 92 },
];

const REPARTITION_DATA = [
  { name: 'Mobile Money',      value: 42, color: '#FF6B35' },
  { name: 'E-commerce',        value: 28, color: '#FF9F40' },
  { name: 'Jeux en ligne',     value: 16, color: '#FFD700' },
  { name: 'Services digitaux', value: 14, color: '#2EC4B6' },
];

const OBJECTIFS = [
  { label: 'Recettes annuelles',  pct: 78, color: '#00853F' },
  { label: 'Efficacité fiscale',  pct: 92, color: '#3b82f6' },
  { label: 'Couverture digitale', pct: 65, color: '#8b5cf6' },
];

/* ── Component ───────────────────────────────────────────────────────────── */
export default function AnalyseRevenusPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [_reports, setReports] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') {
      api.get('/dashboard/fiscal-reports').then((r: { data: { fiscal_reports?: [] } }) =>
        setReports(r.data.fiscal_reports || [])
      ).catch(() => {});
    }
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Dark banner ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Analyses des Revenus Fiscaux</h1>
              <p className="text-slate-400 text-xs mt-0.5">Suivi et analyse des recettes fiscales numériques</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#4ade80] bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              Croissance +18.7%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Recettes Annuelles</p>
              <p className="text-lg font-bold text-white leading-tight">45,6B CFA</p>
              <p className="text-[#4ade80] text-xs mt-1">+18.7% vs 2023</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Recettes Mensuelles</p>
              <p className="text-lg font-bold text-white leading-tight">4,8B CFA</p>
              <p className="text-[#4ade80] text-xs mt-1">+4.1% vs mois dernier</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Efficacité Fiscale</p>
              <p className="text-lg font-bold text-white">82.5%</p>
              <p className="text-[#4ade80] text-xs mt-1">+2.1% ce trimestre</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Objectif Annuel</p>
              <p className="text-lg font-bold text-white">78%</p>
              <p className="text-[#4ade80] text-xs mt-1">En avance sur objectif</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6 space-y-5">

      {/* ── Row 1: Monthly area + Regional horizontal bar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Évolution Mensuelle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Évolution Mensuelle des Recettes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMensuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00853F" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00853F" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtB} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => fmtCFA(v)} labelStyle={{ fontWeight: 600 }} />
              <Area
                type="monotone"
                dataKey="recettes"
                name="Recettes"
                stroke="#00853F"
                fill="url(#gradMensuel)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Croissance par Région — horizontal bars */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Croissance par Région</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={REGION_DATA}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 0.35]}
              />
              <YAxis
                type="category"
                dataKey="region"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} labelStyle={{ fontWeight: 600 }} />
              <Bar dataKey="croissance" name="Croissance" fill="#00853F" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Performance Trimestrielle 2024 (full width) ──────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Performance Trimestrielle 2024</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={TRIMESTRE_DATA} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="trimestre" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtB} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 14_000_000_000]} />
            <Tooltip formatter={(v: number) => fmtCFA(v)} labelStyle={{ fontWeight: 600 }} />
            <Line
              type="monotone"
              dataKey="volume"
              name="Volume"
              stroke="#00853F"
              strokeWidth={2.5}
              dot={{ fill: '#00853F', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 3: Radar + Répartition ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Efficacité Fiscale par Secteur */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Efficacité Fiscale par Secteur</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={SECTEUR_RADAR} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar
                name="Efficacité"
                dataKey="efficacite"
                stroke="#00853F"
                fill="#00853F"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des Recettes par Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Répartition des Recettes par Type</h2>
          <div className="flex items-center gap-4 h-[220px]">
            <ResponsiveContainer width="45%" height="100%">
              <PieChart>
                <Pie
                  data={REPARTITION_DATA}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {REPARTITION_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {REPARTITION_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-gray-800">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Three bottom cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Top Performances */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top Performances</h2>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-900">Tambacounda</p>
                <p className="text-xs text-gray-400 mt-0.5">Croissance la plus forte</p>
              </div>
              <span className="text-sm font-bold text-[#00853F]">+28.4%</span>
            </div>
            <div className="flex items-start justify-between p-3 bg-blue-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-900">Jeux en ligne</p>
                <p className="text-xs text-gray-400 mt-0.5">Meilleure efficacité</p>
              </div>
              <span className="text-sm font-bold text-blue-600">92%</span>
            </div>
          </div>
        </div>

        {/* Objectifs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Objectifs</h2>
          <div className="space-y-4">
            {OBJECTIFS.map(o => (
              <div key={o.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{o.label}</span>
                  <span className="text-xs font-semibold" style={{ color: o.color }}>{o.pct}% atteint</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${o.pct}%`, background: o.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prévisions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Prévisions</h2>
          <div className="space-y-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">52 000 000 000 F CFA</p>
              <p className="text-xs text-gray-500 mt-1">Recettes prévues 2025</p>
              <p className="text-xs font-semibold text-[#00853F] mt-1">+14% croissance prévue</p>
            </div>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700">Q4 2024 — Période critique</p>
                <p className="text-xs text-amber-500 mt-0.5">Surveillance renforcée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}

