'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Edit2, Trash2, X, Eye, EyeOff,
  ChevronLeft, ChevronRight, Settings2, Download,
  UserCheck, UserX, Mail, Phone, Building2, Calendar, KeyRound, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';

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
  AUDITEUR_FISCAL: 'bg-amber-100 text-amber-700',
  AGENT_DGID: 'bg-sky-100 text-sky-700',
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

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const SELECT = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

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

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail modal (clic sur la ligne)
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  // "Gérer" modal (bouton Gérer)
  const [manageTarget, setManageTarget] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Export
  const [showExport, setShowExport] = useState(false);

  const EXPORT_FIELDS: ExportField[] = [
    { key: 'full_name',     label: 'Nom complet' },
    { key: 'username',      label: "Nom d'utilisateur" },
    { key: 'email',         label: 'Email' },
    { key: 'role',          label: 'Rôle' },
    { key: 'is_active',     label: 'Statut actif' },
    { key: 'phone_number',  label: 'Téléphone',    defaultSelected: false },
    { key: 'organization',  label: 'Organisation', defaultSelected: false },
    { key: 'created_at',    label: 'Date création', defaultSelected: false },
    { key: 'id',            label: 'ID',            defaultSelected: false },
  ];

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setShowFormModal(true);
  };

  const openEdit = (u: User) => {
    setManageTarget(null);
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
    setShowFormModal(true);
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
      setShowFormModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setFormError(e.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    setToggling(true);
    try {
      if (u.is_active) {
        await api.patch(`/users/${u.id}/deactivate`);
      } else {
        await api.patch(`/users/${u.id}/activate`);
      }
      setManageTarget(null);
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  const openDelete = (u: User) => {
    setManageTarget(null);
    setDeleteTarget(u);
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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            disabled={users.length === 0}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`${INPUT} pl-9`}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className={SELECT}
          style={{ maxWidth: 200 }}
        >
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="h-10 w-10 mb-2" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => setViewTarget(u)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.organization || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setManageTarget(u); }}
                        className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Gérer
                      </button>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Détails utilisateur (clic sur la ligne) ───────────── */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Détails du compte</span>
                <button onClick={() => setViewTarget(null)} className="text-white/70 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {viewTarget.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-bold text-white text-lg leading-tight">{viewTarget.full_name}</p>
                  <p className="text-blue-200 text-sm">@{viewTarget.username}</p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${viewTarget.is_active ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-200'}`}>
                    {viewTarget.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 text-white`}>
                    {ROLES.find(r => r.value === viewTarget.role)?.label || viewTarget.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Adresse email</p>
                    <p className="text-sm text-gray-800 font-medium">{viewTarget.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Téléphone</p>
                    <p className="text-sm text-gray-800 font-medium">{viewTarget.phone_number || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Building2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Organisation</p>
                    <p className="text-sm text-gray-800 font-medium">{viewTarget.organization || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Rôle</p>
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[viewTarget.role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLES.find(r => r.value === viewTarget.role)?.label || viewTarget.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Créé le</p>
                      <p className="text-sm text-gray-800 font-medium">
                        {viewTarget.created_at
                          ? new Date(viewTarget.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <KeyRound className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Identifiant (ID)</p>
                    <p className="text-xs text-gray-500 font-mono break-all">{viewTarget.id}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewTarget(null)}
                className="w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal "Gérer" — actions uniquement ──────────────────────── */}
      {manageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">

            {/* Header compact */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {manageTarget.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{manageTarget.full_name}</p>
                  <p className="text-xs text-gray-400">@{manageTarget.username}</p>
                </div>
              </div>
              <button onClick={() => setManageTarget(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 space-y-2.5">

              <button
                onClick={() => openEdit(manageTarget)}
                className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Modifier les informations
              </button>

              <button
                onClick={() => toggleActive(manageTarget)}
                disabled={toggling}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors border disabled:opacity-60 ${
                  manageTarget.is_active
                    ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
                    : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
                }`}
              >
                {manageTarget.is_active
                  ? <><UserX className="h-4 w-4" />{toggling ? 'Désactivation...' : 'Désactiver le compte'}</>
                  : <><UserCheck className="h-4 w-4" />{toggling ? 'Activation...' : 'Activer le compte'}</>
                }
              </button>

              <button
                onClick={() => openDelete(manageTarget)}
                className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer le compte
              </button>

              <button
                onClick={() => setManageTarget(null)}
                className="w-full text-center text-gray-400 hover:text-gray-600 text-sm py-1.5 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Créer / Modifier ──────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-50">
              <h2 className="text-lg font-bold text-blue-800">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
                  <input type="text" required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className={INPUT} placeholder="Prénom Nom" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom d&apos;utilisateur *</label>
                  <input type="text" required value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className={INPUT} placeholder="username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={INPUT} placeholder="email@exemple.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : '*'}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required={!editingUser}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={INPUT} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rôle *</label>
                  <select required value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className={SELECT}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                  <input type="tel" value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className={INPUT} placeholder="+224..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation</label>
                  <input type="text" value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className={INPUT} placeholder="Nom de l'organisation" />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{formError}</div>
              )}

              {!editingUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                  Un email avec les identifiants de connexion sera envoyé automatiquement.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
                  {saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Export ────────────────────────────────────────────── */}
      {showExport && (
        <ExportModal
          title="Liste des utilisateurs TAXUP"
          fields={EXPORT_FIELDS}
          data={users as unknown as Record<string, unknown>[]}
          filename="taxup_utilisateurs"
          onClose={() => setShowExport(false)}
        />
      )}

      {/* ── Modal Supprimer ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Supprimer le compte</h2>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Supprimer <span className="font-semibold">{deleteTarget.full_name}</span> (@{deleteTarget.username}) définitivement ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg py-2.5 text-sm font-semibold">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
