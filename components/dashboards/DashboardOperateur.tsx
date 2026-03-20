'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, TrendingUp, CheckCircle, AlertTriangle, Plus, Clock } from 'lucide-react';
import Header from '@/components/Header';
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
  risk_score?: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Complété', color: 'text-blue-600 bg-blue-50' },
  PENDING: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50' },
  FAILED: { label: 'Échoué', color: 'text-red-600 bg-red-50' },
  FLAGGED: { label: 'Signalé', color: 'text-orange-600 bg-orange-50' },
};

const typeLabel: Record<string, string> = {
  TRANSFER: 'Transfert', PAYMENT: 'Paiement', DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait', MOBILE_PAYMENT: 'Paiement mobile',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

export default function DashboardOperateur() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, flagged: 0, volume: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ transaction_type: 'TRANSFER', amount: '', currency: 'XOF', sender_phone: '', recipient_phone: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/transactions?page_size=15')
      .then((res) => {
        const items: Transaction[] = res.data.items || [];
        setTransactions(items);
        setStats({
          total: res.data.total || items.length,
          completed: items.filter(t => t.status === 'COMPLETED').length,
          flagged: items.filter(t => t.status === 'FLAGGED' || (t.risk_score && t.risk_score > 0.7)).length,
          volume: items.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
      setSubmitMsg('Transaction créée avec succès.');
      setShowForm(false);
      setForm({ transaction_type: 'TRANSFER', amount: '', currency: 'XOF', sender_phone: '', recipient_phone: '', description: '' });
      fetchData();
    } catch {
      setSubmitMsg('Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Tableau de bord Opérateur" subtitle="Gestion des transactions de votre réseau" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total transactions" value={stats.total} icon={ArrowLeftRight} color="blue" />
          <StatCard title="Complétées" value={stats.completed} icon={CheckCircle} color="green" />
          <StatCard title="Signalées" value={stats.flagged} icon={AlertTriangle} color="red" />
          <StatCard title="Volume traité" value={formatXOF(stats.volume)} icon={TrendingUp} color="purple" />
        </div>

        {/* Submit feedback */}
        {submitMsg && (
          <div className={`rounded-lg px-4 py-3 text-sm ${submitMsg.includes('succès') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {submitMsg}
          </div>
        )}

        {/* New transaction form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Nouvelle transaction</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              {showForm ? 'Annuler' : 'Créer'}
            </button>
          </div>
          {showForm && (
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={form.transaction_type}
                  onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {['TRANSFER', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL', 'MOBILE_PAYMENT'].map(t => (
                    <option key={t} value={t}>{typeLabel[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XOF) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone émetteur *</label>
                <input
                  type="text"
                  value={form.sender_phone}
                  onChange={e => setForm({ ...form, sender_phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+224600000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone destinataire *</label>
                <input
                  type="text"
                  value={form.recipient_phone}
                  onChange={e => setForm({ ...form, recipient_phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+224600000001"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paiement facture..."
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-green-300 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                >
                  {submitting ? 'Envoi...' : 'Soumettre la transaction'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recent transactions table */}
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
              <p>Aucune transaction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Émetteur</th>
                    <th className="px-6 py-3 text-left">Destinataire</th>
                    <th className="px-6 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-center">Statut</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(tx => {
                    const s = statusConfig[tx.status] || statusConfig.PENDING;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{typeLabel[tx.transaction_type] || tx.transaction_type}</td>
                        <td className="px-6 py-4 text-gray-500">{tx.sender_phone || '—'}</td>
                        <td className="px-6 py-4 text-gray-500">{tx.recipient_phone || '—'}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatXOF(tx.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{new Date(tx.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/transactions" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4 transition-colors group">
            <div className="bg-blue-50 p-3 rounded-lg"><ArrowLeftRight className="h-6 w-6 text-blue-600" /></div>
            <div><p className="font-semibold text-gray-800">Toutes les transactions</p><p className="text-sm text-gray-500">Voir et filtrer l&apos;historique</p></div>
          </a>
          <a href="/receipts" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-4 transition-colors group">
            <div className="bg-purple-50 p-3 rounded-lg"><Clock className="h-6 w-6 text-purple-600" /></div>
            <div><p className="font-semibold text-gray-800">Reçus fiscaux</p><p className="text-sm text-gray-500">Consulter les reçus générés</p></div>
          </a>
        </div>
      </main>
    </div>
  );
}
