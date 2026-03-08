'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Search, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Audit {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  findings_count?: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-600 bg-blue-50', icon: AlertCircle },
  IN_PROGRESS: { label: 'En cours', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  COMPLETED: { label: 'Terminé', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  CLOSED: { label: 'Fermé', color: 'text-gray-600 bg-gray-100', icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'text-gray-500 bg-gray-100' },
  MEDIUM: { label: 'Moyen', color: 'text-blue-600 bg-blue-50' },
  HIGH: { label: 'Élevé', color: 'text-orange-600 bg-orange-50' },
  CRITICAL: { label: 'Critique', color: 'text-red-600 bg-red-50' },
};

export default function AuditsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  const canCreate = ['AGENT_DGID', 'AUDITEUR_FISCAL', 'ADMIN'].includes(user?.role || '');

  const fetch = () => {
    setLoading(true);
    api.get(`/audits?page=${page}&page_size=${pageSize}`)
      .then(res => { setAudits(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/audits', form);
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'MEDIUM' });
      fetch();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = audits.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Audits fiscaux" subtitle={`${total} audit${total > 1 ? 's' : ''}`} />
      <main className="flex-1 p-6 space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un audit..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {canCreate && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              {showForm ? 'Annuler' : 'Nouvel audit'}
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Créer un audit</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Audit de conformité Q1 2026" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {Object.entries(priorityConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Description optionnelle" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
                  {submitting ? 'Création...' : 'Créer l\'audit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun audit trouvé</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {filtered.map(audit => {
                  const s = statusConfig[audit.status] || statusConfig.OPEN;
                  const p = priorityConfig[audit.priority] || priorityConfig.MEDIUM;
                  const StatusIcon = s.icon;
                  return (
                    <div key={audit.id} className="px-6 py-5 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{audit.title}</p>
                          {audit.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{audit.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(audit.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.color}`}>{p.label}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                          <StatusIcon className="h-3 w-3" />{s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} · {total} résultats</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Précédent</button>
                  <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
