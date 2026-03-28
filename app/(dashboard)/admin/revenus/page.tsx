'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Receipt, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface EvolutionPoint {
  date: string;
  transactions: number;
  volume: number;
  tax_collected: number;
  receipts: number;
}

interface FiscalReport {
  period: string;
  receipt_count: number;
  total_tax_xof: number;
  total_volume_xof: number;
}

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K F CFA`;
  return `${n.toLocaleString('fr-FR')} F CFA`;
}

function formatShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function AnalyseRevenusPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [fiscalReports, setFiscalReports] = useState<FiscalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'AGENT_DGID') {
      fetchData();
    }
  }, [user, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evoRes, fiscalRes] = await Promise.allSettled([
        api.get(`/dashboard/evolution?days=${period}`),
        api.get('/dashboard/fiscal-reports'),
      ]);
      if (evoRes.status === 'fulfilled') setEvolution(evoRes.value.data.evolution || []);
      if (fiscalRes.status === 'fulfilled') setFiscalReports(fiscalRes.value.data.fiscal_reports || []);
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = evolution.reduce((s, d) => s + d.volume, 0);
  const totalTx = evolution.reduce((s, d) => s + d.transactions, 0);
  const totalTax = evolution.reduce((s, d) => s + d.tax_collected, 0);
  const avgValue = totalTx > 0 ? totalVolume / totalTx : 0;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analyse des Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">\u00c9volution des revenus fiscaux et des transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={ArrowUpRight}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Volume Transactions"
              value={totalTx.toLocaleString('fr-FR')}
              subtitle="Nombre total"
              subtitleColor="text-blue-600"
            />
            <KPICard
              icon={TrendingUp}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Valeur Totale"
              value={formatXOF(totalVolume)}
              subtitle="Montant brut"
              subtitleColor="text-emerald-600"
            />
            <KPICard
              icon={Receipt}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              label="TVA Collect\u00e9e (18%)"
              value={formatXOF(totalTax)}
              subtitle="Taxe sur valeur ajout\u00e9e"
              subtitleColor="text-purple-600"
            />
            <KPICard
              icon={DollarSign}
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
              label="Valeur Moyenne"
              value={formatXOF(Math.round(avgValue))}
              subtitle="Par transaction"
              subtitleColor="text-orange-600"
            />
          </div>

          {/* Evolution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume vs Value */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">\u00c9volution Volume vs Valeur - Rapport Quotidien</h2>
              {evolution.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatXOF(Number(value))} />
                    <Legend />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b98130" name="Valeur (F CFA)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tax Collection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Collecte TVA (18%) - Rapport Quotidien</h2>
              {evolution.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatShort} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatXOF(Number(value))} />
                    <Bar dataKey="tax_collected" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="TVA collect\u00e9e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Transaction Evolution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">\u00c9volution du nombre de transactions</h2>
            {evolution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donn\u00e9e</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="transactions" stroke="#2563eb" fill="#2563eb20" name="Transactions" />
                  <Area type="monotone" dataKey="receipts" stroke="#10b981" fill="#10b98120" name="Re\u00e7us fiscaux" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Fiscal Reports Table */}
          {fiscalReports.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  R\u00e9partition par P\u00e9riode Fiscale
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">P\u00e9riode</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Re\u00e7us</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TVA Collect\u00e9e</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fiscalReports.map(r => (
                      <tr key={r.period} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{r.period}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{r.receipt_count.toLocaleString('fr-FR')}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-700">{formatXOF(r.total_tax_xof)}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatXOF(r.total_volume_xof)}</td>
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
  );
}

function KPICard({ icon: Icon, iconBg, iconColor, label, value, subtitle, subtitleColor }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string; subtitle: string; subtitleColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 ${subtitleColor}`}>{subtitle}</p>
    </div>
  );
}
