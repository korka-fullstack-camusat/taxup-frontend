'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Bell,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
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

interface FiscalReceipt {
  id: string;
  receipt_number: string;
  total_amount: number;
  tax_amount: number;
  fiscal_period: string;
  issued_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  COMPLETED: { label: 'Complete', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  FAILED: { label: 'Echoue', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TRANSFER: { label: 'Transfert', icon: ArrowUpRight, color: 'text-green-700' },
  PAYMENT: { label: 'Paiement', icon: ArrowDownLeft, color: 'text-purple-600' },
  DEPOSIT: { label: 'Depot', icon: ArrowDownLeft, color: 'text-emerald-600' },
  WITHDRAWAL: { label: 'Retrait', icon: ArrowUpRight, color: 'text-orange-600' },
  MOBILE_PAYMENT: { label: 'Paiement mobile', icon: Wallet, color: 'text-green-700' },
};

function formatXOF(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardCitoyen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<FiscalReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    volume: 0,
    totalTax: 0,
    receiptsCount: 0
  });

  useEffect(() => {
    Promise.all([
      api.get('/transactions?page_size=8'),
      api.get('/receipts?page_size=5'),
    ])
      .then(([txRes, rcptRes]) => {
        const items: Transaction[] = txRes.data.items || [];
        const rcpts: FiscalReceipt[] = rcptRes.data.items || [];
        setTransactions(items);
        setReceipts(rcpts);
        setStats({
          total: txRes.data.total || items.length,
          completed: items.filter(t => t.status === 'COMPLETED').length,
          pending: items.filter(t => t.status === 'PENDING').length,
          volume: items.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
          totalTax: rcpts.reduce((s, r) => s + r.tax_amount, 0),
          receiptsCount: rcptRes.data.total || rcpts.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Bienvenue,</p>
              <h1 className="text-2xl font-bold mt-1">{user?.full_name || 'Utilisateur'}</h1>
              <p className="text-green-200 text-sm mt-2">Votre espace fiscal personnel TAXUP</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-green-200 mt-1">Transactions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{stats.receiptsCount}</p>
                <p className="text-xs text-green-200 mt-1">Recus fiscaux</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ArrowLeftRight}
            label="Mes transactions"
            value={stats.total}
            bgColor="bg-green-50 dark:bg-green-900/20"
            iconColor="text-green-700"
          />
          <StatCard
            icon={CheckCircle}
            label="Completees"
            value={stats.completed}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={Clock}
            label="En attente"
            value={stats.pending}
            bgColor="bg-amber-50 dark:bg-amber-900/20"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Volume total"
            value={formatXOF(stats.volume)}
            bgColor="bg-purple-50 dark:bg-purple-900/20"
            iconColor="text-purple-600"
            isLarge
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/transactions"
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 flex items-center gap-4 hover:shadow-lg hover:border-green-200 dark:hover:bg-slate-800 transition-all"
          >
            <div className="bg-green-100 p-4 rounded-xl group-hover:bg-green-700 transition-colors">
              <ArrowLeftRight className="h-6 w-6 text-green-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-white">Mes transactions</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Consulter l&apos;historique complet</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-slate-500 group-hover:text-green-700 transition-colors" />
          </a>
          <a
            href="/receipts"
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 flex items-center gap-4 hover:shadow-lg hover:border-emerald-200 dark:hover:bg-slate-800 transition-all"
          >
            <div className="bg-emerald-100 p-4 rounded-xl group-hover:bg-emerald-600 transition-colors">
              <Receipt className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-white">Mes recus fiscaux</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Telecharger vos justificatifs</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <ArrowLeftRight className="h-4 w-4 text-green-700" />
                </div>
                <h2 className="font-semibold text-gray-800 dark:text-white">Transactions recentes</h2>
              </div>
              <a href="/transactions" className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aucune transaction pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {transactions.slice(0, 6).map((tx) => {
                  const s = statusConfig[tx.status] || statusConfig.PENDING;
                  const t = typeConfig[tx.transaction_type] || typeConfig.TRANSFER;
                  const TypeIcon = t.icon;
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${t.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center`}>
                          <TypeIcon className={`h-5 w-5 ${t.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{t.label}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.bgColor} ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white min-w-[100px] text-right">
                          {formatXOF(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Receipts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-gray-800 dark:text-white">Recus fiscaux</h2>
              </div>
              <a href="/receipts" className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            {receipts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun recu fiscal</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {receipts.slice(0, 5).map((r) => (
                  <div key={r.id} className="px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-slate-400">{r.receipt_number}</span>
                      <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-medium">
                        {r.fiscal_period}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">{formatXOF(r.total_amount)}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(r.issued_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {stats.totalTax > 0 && (
              <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Total taxes payees</span>
                  <span className="text-sm font-bold text-emerald-700">{formatXOF(stats.totalTax)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  bgColor,
  iconColor,
  isLarge = false
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
  isLarge?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`${bgColor} p-2.5 rounded-xl`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className={`${isLarge ? 'text-lg' : 'text-2xl'} font-bold text-gray-800 dark:text-white`}>{value}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
