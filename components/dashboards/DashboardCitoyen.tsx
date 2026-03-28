'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Receipt, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string;
  created_at: string;
  recipient_phone?: string;
  sender_phone?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Complété', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  FAILED: { label: 'Échoué', color: 'text-red-600 bg-red-50', icon: XCircle },
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert',
  PAYMENT: 'Paiement',
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  MOBILE_PAYMENT: 'Paiement mobile',
};

function formatXOF(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
}

export default function DashboardCitoyen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, volume: 0 });

  useEffect(() => {
    api.get('/transactions?page_size=10')
      .then((res) => {
        const items: Transaction[] = res.data.items || [];
        setTransactions(items);
        setStats({
          total: res.data.total || items.length,
          completed: items.filter(t => t.status === 'COMPLETED').length,
          pending: items.filter(t => t.status === 'PENDING').length,
          volume: items.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mes transactions" value={stats.total} icon={ArrowLeftRight} color="blue" />
          <StatCard title="Complétées" value={stats.completed} icon={CheckCircle} color="green" />
          <StatCard title="En attente" value={stats.pending} icon={Clock} color="yellow" />
          <StatCard title="Volume total" value={formatXOF(stats.volume)} icon={TrendingUp} color="purple" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/transactions" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 flex items-center gap-4 transition-colors group">
            <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Mes transactions</p>
              <p className="text-sm text-green-100">Consulter l&apos;historique complet</p>
            </div>
          </a>
          <a href="/receipts" className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl p-5 flex items-center gap-4 transition-colors group">
            <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Mes reçus fiscaux</p>
              <p className="text-sm text-gray-500">Télécharger vos justificatifs</p>
            </div>
          </a>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Transactions récentes</h2>
            <a href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout →</a>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const s = statusConfig[tx.status] || statusConfig.PENDING;
                const StatusIcon = s.icon;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                        <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{typeLabel[tx.transaction_type] || tx.transaction_type}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {s.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{formatXOF(tx.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
