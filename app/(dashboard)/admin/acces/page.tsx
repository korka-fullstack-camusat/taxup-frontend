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
  { value: 'ADMIN',            label: 'Administrateur',  color: 'bg-green-100 text-green-900' },
  { value: 'AGENT_DGID',       label: 'Analyste Senior', color: 'bg-green-100 text-green-800' },
  { value: 'AUDITEUR_FISCAL',  label: 'Auditeur',        color: 'bg-green-50  text-green-700' },
  { value: 'OPERATEUR_MOBILE', label: 'Opérateur',       color: 'bg-green-50  text-green-600' },
  { value: 'CITOYEN',          label: 'Superviseur',     color: 'bg-slate-100 text-slate-500' },
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

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    { id: 'users' as Tab,  label: 'Utilisateurs' },
    { id: 'roles' as Tab,  label: 'Rôles & Permissions' },
    { id: 'audit' as Tab,  label: "Journal d'Audit" },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Accès et Permissions</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck}     iconBg="bg-green-50"  iconColor="text-green-700"  label="Utilisateurs Actifs"    value={activeUsers.toString()}           subtitle={`+${Math.min(activeUsers, 2)} ce mois`}  subtitleColor="text-green-700" />
        <StatCard icon={Shield}        iconBg="bg-green-50"  iconColor="text-green-800"  label="Rôles Définis"          value={ROLES.length.toString()}          subtitle="Système sécurisé"                          subtitleColor="text-green-800" />
        <StatCard icon={Users}         iconBg="bg-green-100" iconColor="text-green-700"  label="Sessions Actives"       value={Math.min(total, 12).toString()}   subtitle="En temps réel"                             subtitleColor="text-green-700" />
        <StatCard icon={AlertTriangle} iconBg="bg-green-100" iconColor="text-green-900"  label="Tentatives Échouées"    value="3"                                subtitle="Dernières 24h"                             subtitleColor="text-green-900" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Utilisateurs ──────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou département..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Users className="h-10 w-10 mb-2" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Utilisateur', 'Rôle', 'Département', 'Statut', 'Dernière connexion', 'Actions'].map((h, i) => (
                        <th key={h} className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase ${i === 3 || i === 5 ? 'text-center' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-green-50 transition-colors">
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
                        <td className="px-6 py-4 text-gray-600 text-sm">{u.organization || 'DGID - Direction Générale'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setViewUser(u)} title="Voir"
                              className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-700 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => openEdit(u)} title="Modifier"
                              className="p-1.5 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-800 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(u)} title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-green-50 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Rôles ────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Rôles et Permissions du Système</h2>
          <div className="space-y-4">
            {ROLES.map(r => (
              <div key={r.value} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-green-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Key className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.value}</p>
                  </div>
                </div>
                <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                  {users.filter(u => u.role === r.value).length} utilisateur(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Audit ────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Journal d&apos;Audit</h2>
          <div className="space-y-3">
            {[
              { action: 'Connexion',                    user: 'admin@taxup.sn',       time: '14:32', type: 'info'    },
              { action: 'Modification utilisateur',     user: 'admin@taxup.sn',       time: '14:15', type: 'warning' },
              { action: "Création d'un audit",          user: 'auditeur@taxup.sn',    time: '13:45', type: 'success' },
              { action: 'Tentative de connexion échouée', user: 'inconnu@email.com', time: '12:30', type: 'error'   },
              { action: 'Export de données',            user: 'analyste@taxup.sn',    time: '11:20', type: 'info'    },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-green-50 transition-colors">
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  log.type === 'info'    ? 'bg-green-400'  :
                  log.type === 'warning' ? 'bg-green-700'  :
                  log.type === 'success' ? 'bg-green-800'  : 'bg-green-950'
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

      {/* ── Modal Créer / Modifier ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
                  <input type="text" required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Prénom Nom" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom d&apos;utilisateur *</label>
                  <input type="text" required value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="email@exemple.com" />
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 pr-10"
                      placeholder="••••••••"
                    />
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                  <input type="tel" value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="+221..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Département / Organisation</label>
                  <input type="text" value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="DGID - Direction Générale" />
                </div>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{formError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
                  {saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Voir ───────────────────────────────────────────────────── */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Détails utilisateur</h2>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xl font-bold">
                {viewUser.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewUser.full_name}</p>
                <p className="text-sm text-gray-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Username"    value={`@${viewUser.username}`} />
              <InfoRow label="Rôle"        value={roleLabelMap[viewUser.role] || viewUser.role} />
              <InfoRow label="Département" value={viewUser.organization || '-'} />
              <InfoRow label="Téléphone"   value={viewUser.phone_number || '-'} />
              <InfoRow label="Statut"      value={viewUser.is_active ? 'Actif' : 'Inactif'} />
              <InfoRow label="Créé le"     value={viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('fr-FR') : '-'} />
            </div>
            <button onClick={() => setViewUser(null)}
              className="w-full mt-6 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-green-50 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer ──────────────────────────────────────────────── */}
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
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteTarget.full_name}</span> ?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
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

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtitle, subtitleColor }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string; subtitle: string; subtitleColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
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