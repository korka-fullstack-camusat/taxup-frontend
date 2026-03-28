'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Edit2, Trash2, Eye, X, EyeOff,
  ChevronLeft, ChevronRight, UserCheck, Shield, AlertTriangle, Key,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone_number?: string;
  organization?: string;
  created_at?: string;
}

interface UserForm {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone_number: string;
  organization: string;
}

const ROLES = [
  { value: 'ADMIN', label: 'Administrateur', color: 'bg-red-100 text-red-700' },
  { value: 'AGENT_DGID', label: 'Analyste Senior', color: 'bg-blue-100 text-blue-700' },
  { value: 'AUDITEUR_FISCAL', label: 'Auditeur', color: 'bg-purple-100 text-purple-700' },
  { value: 'OPERATEUR_MOBILE', label: 'Op\u00e9rateur', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CITOYEN', label: 'Superviseur', color: 'bg-emerald-100 text-emerald-700' },
];

const roleColorMap: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.color]));
const roleLabelMap: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));

const emptyForm: UserForm = {
  username: '', email: '', password: '', full_name: '',
  role: 'CITOYEN', phone_number: '', organization: '',
};

type Tab = 'users' | 'roles' | 'audit';

export default function GestionAccesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View user
  const [viewUser, setViewUser] = useState<User | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      const data = res.data;
      if (data.items) { setUsers(data.items); setTotal(data.total || data.items.length); }
      else if (Array.isArray(data)) { setUsers(data); setTotal(data.length); }
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [user, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const activeUsers = users.filter(u => u.is_active).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ username: u.username, email: u.email, password: '', full_name: u.full_name, role: u.role, phone_number: u.phone_number || '', organization: u.organization || '' });
    setFormError(''); setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      if (editingUser) {
        const payload: Partial<UserForm> = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowModal(false); fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setFormError(e.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await api.delete(`/users/${deleteTarget.id}`); setDeleteTarget(null); fetchUsers(); }
    catch {} finally { setDeleting(false); }
  };

  if (!user || user.role !== 'ADMIN') return null;

  const tabs = [
    { id: 'users' as Tab, label: 'Utilisateurs' },
    { id: 'roles' as Tab, label: 'R\u00f4les & Permissions' },
    { id: 'audit' as Tab, label: 'Journal d\'Audit' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Acc\u00e8s et Permissions</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Utilisateurs Actifs" value={activeUsers.toString()} subtitle={`+${Math.min(activeUsers, 2)} ce mois`} subtitleColor="text-emerald-600" />
        <StatCard icon={Shield} iconBg="bg-blue-50" iconColor="text-blue-600" label="R\u00f4les D\u00e9finis" value={ROLES.length.toString()} subtitle="Syst\u00e8me s\u00e9curis\u00e9" subtitleColor="text-blue-600" />
        <StatCard icon={Users} iconBg="bg-yellow-50" iconColor="text-yellow-600" label="Sessions Actives" value={Math.min(total, 12).toString()} subtitle="En temps r\u00e9el" subtitleColor="text-yellow-600" />
        <StatCard icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" label="Tentatives \u00c9chou\u00e9es" value="3" subtitle="Derni\u00e8res 24h" subtitleColor="text-red-600" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou d\u00e9partement..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Users className="h-10 w-10 mb-2" />
                <p>Aucun utilisateur trouv\u00e9</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">R\u00f4le</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">D\u00e9partement</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Derni\u00e8re connexion</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{u.full_name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColorMap[u.role] || 'bg-gray-100 text-gray-700'}`}>
                            {roleLabelMap[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{u.organization || 'DGID - Direction G\u00e9n\u00e9rale'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setViewUser(u)} title="Voir" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => openEdit(u)} title="Modifier" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(u)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Page {page} sur {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">R\u00f4les et Permissions du Syst\u00e8me</h2>
          <div className="space-y-4">
            {ROLES.map(r => (
              <div key={r.value} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${r.color.split(' ')[0]}`}>
                    <Key className={`h-4 w-4 ${r.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {users.filter(u => u.role === r.value).length} utilisateur(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Journal d&apos;Audit</h2>
          <div className="space-y-3">
            {[
              { action: 'Connexion', user: 'admin@taxup.sn', time: '14:32', type: 'info' },
              { action: 'Modification utilisateur', user: 'admin@taxup.sn', time: '14:15', type: 'warning' },
              { action: 'Cr\u00e9ation d\'un audit', user: 'auditeur@taxup.sn', time: '13:45', type: 'success' },
              { action: 'Tentative de connexion \u00e9chou\u00e9e', user: 'inconnu@email.com', time: '12:30', type: 'error' },
              { action: 'Export de donn\u00e9es', user: 'analyste@taxup.sn', time: '11:20', type: 'info' },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  log.type === 'info' ? 'bg-blue-500' :
                  log.type === 'warning' ? 'bg-yellow-500' :
                  log.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-400">{log.user}</p>
                </div>
                <span className="text-xs text-gray-400">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
                  <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Pr\u00e9nom Nom" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom d&apos;utilisateur *</label>
                  <input type="text" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@exemple.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : '*'}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required={!editingUser} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">R\u00f4le *</label>
                  <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">T\u00e9l\u00e9phone</label>
                  <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+221..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">D\u00e9partement / Organisation</label>
                  <input type="text" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="DGID - Direction G\u00e9n\u00e9rale" />
                </div>
              </div>
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{formError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg py-2.5 text-sm font-semibold">
                  {saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Cr\u00e9er')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">D\u00e9tails utilisateur</h2>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
                {viewUser.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewUser.full_name}</p>
                <p className="text-sm text-gray-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Username" value={`@${viewUser.username}`} />
              <InfoRow label="R\u00f4le" value={roleLabelMap[viewUser.role] || viewUser.role} />
              <InfoRow label="D\u00e9partement" value={viewUser.organization || '-'} />
              <InfoRow label="T\u00e9l\u00e9phone" value={viewUser.phone_number || '-'} />
              <InfoRow label="Statut" value={viewUser.is_active ? 'Actif' : 'Inactif'} />
              <InfoRow label="Cr\u00e9\u00e9 le" value={viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('fr-FR') : '-'} />
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-6 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h2 className="font-bold text-gray-800">Supprimer l&apos;utilisateur</h2>
                <p className="text-sm text-gray-500">Cette action est irr\u00e9versible</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              \u00cates-vous s\u00fbr de vouloir supprimer <span className="font-semibold">{deleteTarget.full_name}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Annuler</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg py-2.5 text-sm font-semibold">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtitle, subtitleColor }: {
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}
