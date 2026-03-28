'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowLeftRight, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Clock,
  Wallet,
  Send,
  Activity,
  ChevronRight,
  RefreshCw,
  Smartphone,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  currency: string;
  created_at: string;
  recipient_phone?: string;
  sender_phone?: string;
  risk_score?: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  COMPLETED: { label: 'Complete', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  PENDING: { label: 'En attente', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  FAILED: { label: 'Echoue', color: 'text-red-600', bgColor: 'bg-red-50' },
  FLAGGED: { label: 'Signale', color: 'text-orange-600', bgColor: 'bg-orange-50' },
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Depot',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
};

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function DashboardOperateur() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    completed: 0, 
    pending: 0,
    flagged: 0, 
    volume: 0,
    todayCount: 0,
    todayVolume: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    transaction_type: 'TRANSFER', 
    amount: '', 
    currency: 'XOF', 
    sender_phone: '', 
    recipient_phone: '', 
    description: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  const fetchData = () => {
    setLoading(true);
    api.get('/transactions?page_size=20')
      .then((res) => {
        const items: Transaction[] = res.data.items || [];
        const today = new Date().toDateString();
        const todayTx = items.filter(t => new Date(t.created_at).toDateString() === today);
        
        setTransactions(items);
        setStats({
          total: res.data.total || items.length,
          completed: items.filter(t => t.status === 'COMPLETED').length,
          pending: items.filter(t => t.status === 'PENDING').length,
          flagged: items.filter(t => t.status === 'FLAGGED' || (t.risk_score && t.risk_score > 0.7)).length,
          volume: items.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
          todayCount: todayTx.length,
          todayVolume: todayTx.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg({ type: '', text: '' });
    try {
      await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
      setSubmitMsg({ type: 'success', text: 'Transaction creee avec succes.' });
      setShowForm(false);
      setForm({ transaction_type: 'TRANSFER', amount: '', currency: 'XOF', sender_phone: '', recipient_phone: '', description: '' });
      fetchData();
    } catch {
      setSubmitMsg({ type: 'error', text: 'Erreur lors de la creation.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Chart data
  const statusData = [
    { name: 'Completees', value: stats.completed, color: '#10b981' },
    { name: 'En attente', value: stats.pending, color: '#f59e0b' },
    { name: 'Signalees', value: stats.flagged, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const typeData = Object.entries(
    transactions.reduce((acc, tx) => {
      const type = typeLabel[tx.transaction_type] || tx.transaction_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord Operateur</h1>
            <p className="text-gray-500 text-sm mt-1">Bienvenue, {user?.full_name || 'Operateur'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" /> Nouvelle transaction
            </button>
          </div>
        </div>

        {/* Alert Message */}
        {submitMsg.text && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between ${
            submitMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <span>{submitMsg.text}</span>
            <button onClick={() => setSubmitMsg({ type: '', text: '' })} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={ArrowLeftRight} 
            label="Total transactions" 
            value={stats.total}
            subtitle={`${stats.todayCount} aujourd'hui`}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Completees" 
            value={stats.completed}
            gradient="from-emerald-500 to-emerald-600"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Signalees" 
            value={stats.flagged}
            gradient="from-red-500 to-red-600"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Volume traite" 
            value={formatShort(stats.volume)}
            subtitle={`${formatShort(stats.todayVolume)} aujourd'hui`}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Charts + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Repartition par statut
            </h3>
            {statusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie 
                    data={statusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={45} 
                    outerRadius={70} 
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" />
              Par type de transaction
            </h3>
            {typeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              Actions rapides
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
              >
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Creer une transaction</p>
                  <p className="text-xs text-gray-500">Transfert, paiement, depot...</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </button>
              <a 
                href="/transactions"
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className="bg-gray-600 p-2 rounded-lg">
                  <ArrowLeftRight className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Voir toutes les transactions</p>
                  <p className="text-xs text-gray-500">Historique et filtres</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </a>
              <a 
                href="/receipts"
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Recus fiscaux</p>
                  <p className="text-xs text-gray-500">Consulter et telecharger</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <ArrowLeftRight className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-800">Transactions recentes</h2>
            </div>
            <a href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Voir tout <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune transaction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Emetteur</th>
                    <th className="px-6 py-3 text-left">Destinataire</th>
                    <th className="px-6 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-center">Risque</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.slice(0, 10).map(tx => {
                    const s = statusConfig[tx.status] || statusConfig.PENDING;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${tx.transaction_type === 'WITHDRAWAL' || tx.transaction_type === 'TRANSFER' ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                              {tx.transaction_type === 'WITHDRAWAL' || tx.transaction_type === 'TRANSFER' 
                                ? <ArrowUpRight className="h-3.5 w-3.5 text-orange-600" />
                                : <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                              }
                            </div>
                            <span className="font-medium text-gray-800">{typeLabel[tx.transaction_type] || tx.transaction_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.sender_phone || '—'}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.recipient_phone || '—'}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatXOF(tx.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.bgColor} ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tx.risk_score != null ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              tx.risk_score >= 0.7 ? 'text-red-600 bg-red-50' :
                              tx.risk_score >= 0.4 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50'
                            }`}>{Math.round(tx.risk_score * 100)}%</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Nouvelle transaction</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
                    <select
                      value={form.transaction_type}
                      onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {Object.entries(typeLabel).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (XOF) *</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10000"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telephone emetteur *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.sender_phone}
                        onChange={e => setForm({ ...form, sender_phone: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+221 77 000 0000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telephone destinataire *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.recipient_phone}
                        onChange={e => setForm({ ...form, recipient_phone: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+221 77 000 0001"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paiement facture electricite..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {submitting ? 'Envoi...' : 'Creer la transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  gradient 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
    </div>
  );
}
