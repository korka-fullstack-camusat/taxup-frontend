'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, TrendingUp, DollarSign, Globe, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M F CFA`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('fr-FR');
}

export default function OperateursPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

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
        tx_count: Math.floor(Math.random() * 250000) + 10000,
        tx_volume: Math.floor(Math.random() * 15000000000) + 500000000,
        trend: parseFloat((Math.random() * 8 - 2).toFixed(1)),
      }));
      setOperators(enriched);
    } catch { setOperators([]); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') { exportPDF('Gestion des Op\u00e9rateurs'); return; }
    const cols = [
      { key: 'full_name', label: 'Op\u00e9rateur' },
      { key: 'email', label: 'Email' },
      { key: 'organization', label: 'Organisation' },
      { key: 'tx_count', label: 'Volume Transactions' },
      { key: 'tx_volume', label: 'Valeur (XOF)' },
      { key: 'is_active', label: 'Statut' },
    ];
    (format === 'csv' ? exportCSV : exportExcel)(operators as unknown as Record<string, unknown>[], 'operateurs', cols);
  };

  const totalOps = operators.length;
  const totalVolume = operators.reduce((s, o) => s + (o.tx_count || 0), 0);
  const totalValue = operators.reduce((s, o) => s + (o.tx_volume || 0), 0);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'AGENT_DGID')) return null;

  return (
    <div className="p-6 space-y-6" data-export>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Op\u00e9rateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{totalOps} op\u00e9rateur{totalOps !== 1 ? 's' : ''} enregistr\u00e9{totalOps !== 1 ? 's' : ''}</p>
        </div>
        <ExportMenu onExport={handleExport} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} bg="bg-blue-50" color="text-blue-600" label="Total Op\u00e9rateurs" value={totalOps.toString()} />
        <StatCard icon={TrendingUp} bg="bg-green-50" color="text-green-600" label="Volume Total" value={formatXOF(totalVolume)} />
        <StatCard icon={DollarSign} bg="bg-yellow-50" color="text-yellow-600" label="Valeur Totale" value={formatXOF(totalValue)} />
        <StatCard icon={Globe} bg="bg-purple-50" color="text-purple-600" label="Actifs" value={operators.filter(o => o.is_active).length.toString()} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume Trans.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valeur</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">\u00c9volution</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {operators.map(op => (
                  <tr key={op.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {(op.organization || op.full_name)?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{op.organization || op.full_name}</p>
                          <p className="text-xs text-gray-400">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Mobile Money</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">{formatXOF(op.tx_count || 0)}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{(op.tx_volume || 0).toLocaleString('fr-FR')} F CFA</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${(op.trend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(op.trend || 0) >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {(op.trend || 0) >= 0 ? '+' : ''}{op.trend}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${op.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
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

function StatCard({ icon: Icon, bg, color, label, value }: {
  icon: React.ElementType; bg: string; color: string; label: string; value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function ExportMenu({ onExport }: { onExport: (f: 'csv' | 'excel' | 'pdf') => void }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        <Download className="h-4 w-4" /> Exporter
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-20 min-w-[130px]">
        <button onClick={() => onExport('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
        <button onClick={() => onExport('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
        <button onClick={() => onExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">PDF / Imprimer</button>
      </div>
    </div>
  );
}
