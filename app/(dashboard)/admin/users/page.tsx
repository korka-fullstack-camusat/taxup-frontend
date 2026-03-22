'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Edit2, Trash2, X, Eye, EyeOff,
  Download,
  UserCheck, UserX, Mail, Phone, Building2, Calendar, KeyRound, ShieldCheck,
  Settings2, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import ExportModal, { ExportField } from '@/components/ExportModal';
import Pagination from '@/components/Pagination';

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

type ManageAction = 'deactivate_confirm' | 'delete_confirm' | null;

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [PAGE_SIZE, setPAGE_SIZE] = useState(15);

  // Détails (clic sur la ligne)
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  // Gérer modal
  const [manageTarget, setManageTarget] = useState<User | null>(null);
  const [manageAction, setManageAction] = useState<ManageAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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

  // ── Gérer modal helpers ────────────────────────────────────────────────────

  const openManage = (u: User) => {
    setManageTarget(u);
    setManageAction(null);
    setActionError('');
  };

  const closeManage = () => {
    setManageTarget(null);
    setManageAction(null);
    setActionError('');
  };

  const handleToggleActive = async () => {
    if (!manageTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (manageTarget.is_active) {
        await api.patch(`/users/${manageTarget.id}/deactivate`);
      } else {
        await api.patch(`/users/${manageTarget.id}/activate`);
      }
      closeManage();
      fetchUsers();
    } catch {
      setActionError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!manageTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.delete(`/users/${manageTarget.id}`);
      closeManage();
      fetchUsers();
    } catch {
      setActionError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Form modal helpers ─────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setShowFormModal(true);
  };

  const openEdit = (u: User) => {
    closeManage();
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

                    {/* Utilisateur */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${u.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {u.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className={`font-medium ${u.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{u.full_name}</p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>

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

                    {/* ── Bouton Gérer ── */}
                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openManage(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
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

        <Pagination
          page={page} total={total} pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={size => { setPAGE_SIZE(size); setPage(1); }}
          pageSizeOptions={[10, 15, 25, 50]}
        />
      </div>

      {/* ── Modal Détails (clic sur la ligne) ───────────────────────── */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 text-white">
                    {ROLES.find(r => r.value === viewTarget.role)?.label || viewTarget.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs text-gray-400 font-medium">Adresse email</p><p className="text-sm text-gray-800 font-medium">{viewTarget.email}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs text-gray-400 font-medium">Téléphone</p><p className="text-sm text-gray-800 font-medium">{viewTarget.phone_number || '—'}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Building2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs text-gray-400 font-medium">Organisation</p><p className="text-sm text-gray-800 font-medium">{viewTarget.organization || '—'}</p></div>
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
                      {viewTarget.created_at ? new Date(viewTarget.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <KeyRound className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs text-gray-400 font-medium">Identifiant (ID)</p><p className="text-xs text-gray-500 font-mono break-all">{viewTarget.id}</p></div>
              </div>
              <button onClick={() => setViewTarget(null)} className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          Modal GÉRER — toutes les actions dans un seul modal
      ════════════════════════════════════════════════════════════ */}
      {manageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            {/* ── En-tête minimaliste ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Actions — <span className="text-blue-600">{manageTarget.full_name}</span></h2>
              <button onClick={closeManage} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Corps du modal ── */}
            <div className="px-5 py-4 space-y-2">

              {/* Panneau de confirmation désactivation */}
              {manageAction === 'deactivate_confirm' && (
                <div className={`rounded-xl border p-4 ${manageTarget.is_active ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${manageTarget.is_active ? 'text-orange-500' : 'text-green-500'}`} />
                    <div>
                      <p className={`font-semibold text-sm ${manageTarget.is_active ? 'text-orange-800' : 'text-green-800'}`}>
                        {manageTarget.is_active ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
                      </p>
                      <p className={`text-xs mt-0.5 ${manageTarget.is_active ? 'text-orange-600' : 'text-green-600'}`}>
                        {manageTarget.is_active
                          ? `${manageTarget.full_name} ne pourra plus se connecter à la plateforme.`
                          : `${manageTarget.full_name} pourra de nouveau se connecter à la plateforme.`
                        }
                      </p>
                    </div>
                  </div>
                  {actionError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{actionError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setManageAction(null); setActionError(''); }}
                      className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleToggleActive}
                      disabled={actionLoading}
                      className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 ${
                        manageTarget.is_active
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {actionLoading ? 'Traitement...' : (manageTarget.is_active ? 'Désactiver' : 'Activer')}
                    </button>
                  </div>
                </div>
              )}

              {/* Panneau de confirmation suppression */}
              {manageAction === 'delete_confirm' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-red-800">Supprimer définitivement ?</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Le compte de <span className="font-semibold">{manageTarget.full_name}</span> sera supprimé de façon irréversible. Toutes ses données seront perdues.
                      </p>
                    </div>
                  </div>
                  {actionError && (
                    <p className="text-xs text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2 mb-3">{actionError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setManageAction(null); setActionError(''); }}
                      className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      {actionLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions principales (masquées pendant une confirmation) */}
              {manageAction !== 'deactivate_confirm' && manageAction !== 'delete_confirm' && (
                <>
                  {/* Modifier */}
                  <button
                    onClick={() => openEdit(manageTarget)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left group"
                  >
                    <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                      <Edit2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">Modifier le compte</p>
                      <p className="text-xs text-gray-400">Nom, email, rôle, mot de passe...</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Désactiver / Activer */}
                  <button
                    onClick={() => { setManageAction('deactivate_confirm'); setActionError(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left group ${
                      manageTarget.is_active
                        ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      manageTarget.is_active
                        ? 'bg-orange-100 group-hover:bg-orange-200'
                        : 'bg-green-100 group-hover:bg-green-200'
                    }`}>
                      {manageTarget.is_active
                        ? <UserX className="h-4 w-4 text-orange-600" />
                        : <UserCheck className="h-4 w-4 text-green-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {manageTarget.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {manageTarget.is_active
                          ? 'Empêche la connexion sans supprimer le compte'
                          : 'Restaure l\'accès à la plateforme'
                        }
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Séparateur */}
                  <div className="border-t border-gray-100" />

                  {/* Supprimer */}
                  <button
                    onClick={() => { setManageAction('delete_confirm'); setActionError(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-left group"
                  >
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700">Supprimer le compte</p>
                      <p className="text-xs text-gray-400">Action irréversible — toutes les données seront perdues</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </>
              )}

              {/* Bouton fermer */}
              <button
                onClick={closeManage}
                className="w-full text-center border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Fermer
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
    </div>
  );
}
