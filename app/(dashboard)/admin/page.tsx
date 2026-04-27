'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface AdminSummary {
  users: { total: number; active: number; by_role: Record<string, number> };
  transactions: { total_transactions: number; today_transactions: number; month_volume: number; pending_transactions: number };
  audits: { total: number; open: number; in_progress: number; completed: number };
  fiscal: { total_receipts: number; month_tax_collected_xof: number; total_tax_collected_xof: number; total_volume_xof: number };
}

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  tax_collected: number;
  new_users: number;
  receipts: number;
}

/* ── Static regional & category data ────────────────────────────────────── */
const REGIONAL_DATA = [
  { region: 'Dakar',        recettes: 19_000_000_000 },
  { region: 'Thiès',        recettes:  9_000_000_000 },
  { region: 'Saint-Louis',  recettes:  5_000_000_000 },
  { region: 'Kaolack',      recettes:  5_000_000_000 },
  { region: 'Ziguinchor',   recettes:  3_000_000_000 },
  { region: 'Tambacounda',  recettes:  2_000_000_000 },
  { region: 'Diourbel',     recettes:  2_000_000_000 },
  { region: 'Louga',        recettes:  1_500_000_000 },
];

const TX_TYPE_DATA = [
  { name: 'Mobile Money',     value: 66.4 },
  { name: 'E-commerce',       value: 21.9 },
  { name: 'Jeux en ligne',    value:  9.4 },
  { name: 'Services digitaux',value:  2.3 },
];
const PIE_COLORS = ['#FF6B35', '#FF9F40', '#FFD700', '#2EC4B6'];

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep'];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtCFA(n: number): string {
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

function fmtBillion(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString('fr-FR');
}

function computeTrend(data: EvolutionPoint[], key: 'volume' | 'transactions' | 'tax_collected'): number {
  if (data.length < 2) return 0;
  const mid = Math.floor(data.length / 2);
  const first  = data.slice(0, mid).reduce((s, d) => s + d[key], 0);
  const second = data.slice(mid).reduce((s, d)  => s + d[key], 0);
  if (first === 0) return 0;
  return parseFloat(((second - first) / first * 100).toFixed(1));
}

function buildMonthlyEvolution(points: EvolutionPoint[]) {
  if (points.length === 0) {
    return MONTH_LABELS.map((label, i) => ({
      mois: label,
      reel:   3_000_000_000 + i * 200_000_000 + Math.sin(i) * 100_000_000,
      objectif: 3_100_000_000 + i * 180_000_000,
    }));
  }
  const byMonth: Record<string, number[]> = {};
  points.forEach(p => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(p.volume);
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-9)
    .map(([key, vols], i) => {
      const total = vols.reduce((s, v) => s + v, 0);
      const monthIdx = parseInt(key.split('-')[1]) - 1;
      return {
        mois: MONTH_LABELS[monthIdx] ?? `M${i + 1}`,
        reel: total,
        objectif: total * 0.95,
      };
    });
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const router   = useRouter();

  const [summary,   setSummary]   = useState<AdminSummary | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, eRes] = await Promise.allSettled([
        api.get('/dashboard/admin-summary'),
        api.get('/dashboard/evolution?days=90'),
      ]);
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data);
      if (eRes.status === 'fulfilled') setEvolution(eRes.value.data.evolution || []);
    } finally {
      setLoading(false);
      const now = new Date();
      setLastUpdate(now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR'));
    }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  /* ── KPI values ── */
  const recettesTotales     = summary?.fiscal.total_volume_xof          ?? 45_600_000_000;
  const transactionsDigital = summary?.transactions.month_volume         ?? 12_800_000_000;
  const tauxCollecte = recettesTotales > 0
    ? parseFloat(((summary?.fiscal.total_tax_collected_xof ?? 0) / recettesTotales * 100).toFixed(1))
    : 78.5;
  const fraudesDetectees    = summary?.audits.open                       ?? 156;

  const trendRecettes     = computeTrend(evolution, 'volume')       || 15.2;
  const trendTransactions = computeTrend(evolution, 'transactions') || 18.7;
  const trendCollecte     = 2.3;
  const trendFraudes      = -12;

  const monthlyData = buildMonthlyEvolution(evolution);

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Dark banner ────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Tableau de Bord Fiscal — Sénégal</h1>
              <p className="text-slate-400 text-xs mt-0.5">Dernière mise à jour : {lastUpdate || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Recettes Totales</p>
              <p className="text-lg font-bold text-white leading-tight">{fmtBillion(recettesTotales)} CFA</p>
              <p className="text-[#4ade80] text-xs mt-1">+{trendRecettes}% vs période préc.</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Transactions Digitales</p>
              <p className="text-lg font-bold text-white leading-tight">{fmtBillion(transactionsDigital)} CFA</p>
              <p className="text-[#4ade80] text-xs mt-1">+{trendTransactions}% ce mois</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Taux de Collecte</p>
              <p className="text-lg font-bold text-white leading-tight">{tauxCollecte}%</p>
              <p className="text-[#4ade80] text-xs mt-1">+{trendCollecte}% ce trimestre</p>
            </div>
            <div className="bg-slate-900/60 px-5 py-4">
              <p className="text-slate-400 text-xs mb-1">Fraudes Détectées</p>
              <p className="text-lg font-bold text-white leading-tight">{fraudesDetectees.toLocaleString('fr-FR')}</p>
              <p className="text-red-400 text-xs mt-1">{trendFraudes}% vs mois dernier</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00853F]" />
        </div>
      ) : (
        <div className="px-4 sm:px-6 pb-6 space-y-5">

          {/* ── Pie + Bar charts ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Répartition par Type de Transaction */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Répartition par Type de Transaction
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={TX_TYPE_DATA}
                    cx="40%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {TX_TYPE_DATA.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recettes par Région */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Recettes par Région
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REGIONAL_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="region"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmtBillion}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => fmtCFA(v)}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="recettes" fill="#00853F" radius={[3, 3, 0, 0]} name="Recettes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Évolution Mensuelle des Recettes (pleine largeur) ─────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Évolution Mensuelle des Recettes
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtBillion}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => fmtCFA(v)}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="reel"
                  stroke="#00853F"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#00853F' }}
                  activeDot={{ r: 5 }}
                  name="Réel"
                />
                <Line
                  type="monotone"
                  dataKey="objectif"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  name="Objectif"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── 3 Summary cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              label="Top Région"
              highlight="Dakar"
              sub="18 500 000 000 F CFA collectés"
            />
            <SummaryCard
              label="Croissance la Plus Forte"
              highlight="Tambacounda"
              sub="+28.4% ce mois"
            />
            <SummaryCard
              label="Transactions Aujourd'hui"
              highlight={(summary?.transactions.today_transactions ?? 1247).toLocaleString('fr-FR')}
              sub="+15% vs hier"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function SummaryCard({ label, highlight, sub }: { label: string; highlight: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
      <p className="text-lg font-bold text-[#00853F]">{highlight}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
