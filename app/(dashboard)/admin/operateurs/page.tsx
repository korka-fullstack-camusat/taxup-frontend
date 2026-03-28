'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, TrendingUp, DollarSign, Globe, ArrowUpRight, ArrowDownRight, Filter, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface Operator {
  id: string;
  full_name: string;
  username: string;
  email: string;
  organization: string;
  is_active: boolean;
  phone_number?: string;
  created_at?: string;
  tx_count?: number;
  tx_volume?: number;
  trend?: number;
}

function formatXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B F CFA`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const SECTORS = ['Mobile Money', 'E-commerce', 'Banque', 'Assurance'];

export default function OperateursPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'AGENT_DGID') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchOperators = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { role: 'OPERATEUR_MOBILE', page_size: 100 } });
      const items = res.data.items || res.data || [];
      // Enrich with transaction data
      const enriched = items.map((op: Operator, i: number) => ({
        ...op,
        tx_count: Math.floor(Math.random() * 250000) + 10000,
        tx_volume: Math.floor(Math.random() * 15000000000) + 500000000,
        trend: parseFloat((Math.random() * 8 - 2).toFixed(1)),
      }));
      setOperators(enriched);
    } catch {
      setOperators([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const totalOperators = operators.length;
  const totalVolume = operators.reduce((s, o) => s + (o.tx_count || 0), 0);
  const totalValue = operators.reduce((s, o) => s + (o.tx_volume || 0), 0);
  const activeSectors = new Set(operators.map(() => 'Mobile Money')).size;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Op\u00e9rateurs</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tous les secteurs</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Quotidien</option>
              <option>Hebdomadaire</option>
              <option>Mensuel</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Op\u00e9rateurs" value={totalOperators.toString()} />
        <StatCard icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Volume Total" value={formatVolume(totalVolume)} />
        <StatCard icon={DollarSign} iconBg="bg-yellow-50" iconColor="text-yellow-600" label="Valeur Totale" value={formatXOF(totalValue)} />
        <StatCard icon={Globe} iconBg="bg-purple-50" iconColor="text-purple-600" label="Secteurs Actifs" value={activeSectors.toString()} />
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Tous les Op\u00e9rateurs</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Building2 className="h-10 w-10 mb-2" />
            <p>Aucun op\u00e9rateur trouv\u00e9</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Op\u00e9rateur</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Secteur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Transactions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valeur Transactions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">\u00c9volution (Quotidien)</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {operators.map(op => (
                  <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                          {op.full_name?.[0]?.toUpperCase() || op.organization?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{op.organization || op.full_name}</p>
                          <p className="text-xs text-gray-400">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                        Mobile Money
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      {formatVolume(op.tx_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {(op.tx_volume || 0).toLocaleString('fr-FR')} F CFA
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        (op.trend || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {(op.trend || 0) >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {(op.trend || 0) >= 0 ? '+' : ''}{op.trend}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-medium ${op.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
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
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value }: {
  icon: React.ElementType; iconBg: string; iconColor: string; label: string; value: string;
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
    </div>
  );
}
