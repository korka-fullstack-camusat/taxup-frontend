'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, X, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
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
  { value: 'CITOYEN', label: 'Citoyen' },
  { value: 'OPERATEUR_MOBILE', label: 'Opérateur Mobile' },
  { value: 'AUDITEUR_FISCAL', label: 'Auditeur Fiscal' },
  { value: 'AGENT_DGID', label: 'Agent DGID' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const roleColors: Record<string, string> = {
  CITOYEN: 'bg-blue-100 text-blue-700',
  OPERATEUR_MOBILE: 'bg-purple-100 text-purple-700',
  AUDITEUR_FISCAL: 'bg-yellow-100 text-yellow-700',
  AGENT_DGID: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
};

const emptyForm: UserForm = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  role: 'CITOYEN',
  phone_number: '',
  organization: '',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      const data = res.data;
      if (data.items) {
        setUsers(data.items);
        setTotal(data.total || data.items.length);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user, page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      email: u.email,
      password: '',
      full_name: u.full_name,
      role: u.role,
      phone_number: u.phone_number || '',
      organization: u.organization || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingUser) {
        const payload: Partial<UserForm> = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setFormError(e.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      if (u.is_active) {
        await api.patch(`/users/${u.id}/deactivate`);
      } else {
        await api.patch(`/users/${u.id}/activate`);
      }
      fetchUsers();
    } catch {
      // ignore
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-10 w-10 mb-2" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.full_name}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLES.find(r => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.organization || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(u)}
                          title={u.is_active ? 'Désactiver' : 'Activer'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          {u.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          title="Modifier"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Supprimer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                        >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Créer / Modifier */}
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
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Prénom Nom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom d&apos;utilisateur *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rôle *</label>
                  <select
                    required
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+224..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation</label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nom de l'organisation"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
                >
                  {saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Supprimer l&apos;utilisateur</h2>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteTarget.full_name}</span> (@{deleteTarget.username}) ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg py-2.5 text-sm font-semibold"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
