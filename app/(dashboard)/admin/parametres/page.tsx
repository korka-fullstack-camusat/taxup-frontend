'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Users, FileText, Database, AlertTriangle, Shield, BarChart3,
  Plus, Edit2, Trash2, Save, RefreshCw, X, Eye, EyeOff, Key,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface UserItem {
  id: string; username: string; email: string; full_name: string;
  role: string; is_active: boolean; phone_number?: string; organization?: string; created_at?: string;
}
interface UserForm {
  username: string; email: string; password: string; full_name: string;
  role: string; phone_number: string; organization: string;
}
interface PlatformSettings {
  fraud_threshold: number; max_transaction_amount: number;
  alert_email: string; maintenance_mode: boolean; auto_audit_enabled: boolean;
}

const ROLES = [
  { value: 'ADMIN',            label: 'Administrateur'  },
  { value: 'AGENT_DGID',       label: 'Analyste Senior' },
  { value: 'AUDITEUR_FISCAL',  label: 'Auditeur'        },
  { value: 'OPERATEUR_MOBILE', label: 'Opérateur'       },
  { value: 'CITOYEN',          label: 'Superviseur'     },
];
const roleLabelMap: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));

const emptyForm: UserForm = {
  username: '', email: '', password: '', full_name: '',
  role: 'CITOYEN', phone_number: '', organization: '',
};

type Tab = 'users' | 'fiscal' | 'sources' | 'alerts' | 'custom' | 'security' | 'reports';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'users',    label: 'Gestion Utilisateurs', icon: Users        },
  { id: 'fiscal',   label: 'Règles Fiscales',       icon: FileText     },
  { id: 'sources',  label: 'Sources de Données',    icon: Database     },
  { id: 'alerts',   label: 'Alertes & Seuils',      icon: AlertTriangle},

  { id: 'security', label: 'Sécurité',               icon: Shield       },
  { id: 'reports',  label: 'Rapports',               icon: BarChart3    },
];

export default function ParametresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [settings, setSettings] = useState<PlatformSettings>({
    fraud_threshold: 0.8, max_transaction_amount: 10000000,
    alert_email: '', maintenance_mode: false, auto_audit_enabled: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setUsersLoading(true);
    try {
      const res = await api.get('/users', { params: { page_size: 100 } });
      setUsers(res.data.items || res.data || []);
    } catch { setUsers([]); } finally { setUsersLoading(false); }
  }, [user]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch {} finally { setSettingsLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchSettings(); }, [fetchUsers, fetchSettings]);

  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (u: UserItem) => {
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
      } else { await api.post('/users', form); }
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

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSettingsSaving(true); setSettingsMsg('');
    try { await api.put('/admin/settings', settings); setSettingsMsg('Paramètres enregistrés avec succès.'); }
    catch { setSettingsMsg('Erreur lors de la sauvegarde.'); }
    finally { setSettingsSaving(false); }
  };

  if (!user || user.role !== 'ADMIN') return null;

  // Shared input class
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres du tableau de bord TAXUP</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab: Utilisateurs ──────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Gestion des utilisateurs et des rôles</h2>
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              <Plus className="h-4 w-4" /> Nouvel Utilisateur
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {usersLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                      <tr key={u.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                              {u.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{u.full_name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{roleLabelMap[u.role] || u.role}</td>
                        <td className="px-6 py-4 text-gray-500">{u.organization || 'Direction Générale'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(u)}
                              className="p-1.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
          </div>

          {/* MFA & Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-blue-600" /> Authentification Forte (MFA)
              </h3>
              <p className="text-sm text-gray-500 mb-4">Activez l&apos;authentification à deux facteurs pour renforcer la sécurité des comptes.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">MFA activé pour les admins</span>
                <div className="relative w-11 h-6 rounded-full bg-blue-600 cursor-pointer">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5 transition-transform" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" /> Journal d&apos;Audit
              </h3>
              <p className="text-sm text-gray-500 mb-4">Consultez l&apos;historique des actions effectuées sur la plateforme.</p>
              <div className="space-y-2">
                {['Connexion admin', 'Modification paramètres', 'Création utilisateur'].map((action, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">{action}</span>
                    <span className="text-gray-400 text-xs">Aujourd&apos;hui</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Règles Fiscales ───────────────────────────────────────────── */}
      {activeTab === 'fiscal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Règles Fiscales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA standard (%)</label>
              <input type="number" defaultValue={18} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux réduit (%)</label>
              <input type="number" defaultValue={10} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période fiscale</label>
              <select className={inp}>
                <option>Trimestriel</option><option>Mensuel</option><option>Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <select className={inp}>
                <option>XOF (Franc CFA)</option><option>EUR (Euro)</option><option>USD (Dollar)</option>
              </select>
            </div>
          </div>
          <SaveBtn />
        </div>
      )}

      {/* ── Tab: Sources de Données ───────────────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Sources de Données</h2>
          <div className="space-y-4">
            {[
              { name: 'API Mobile Money',  status: 'connecté',    type: 'API REST',  level: 'high'   },
              { name: 'Base DGID',         status: 'connecté',    type: 'Database',  level: 'high'   },
              { name: 'Système Bancaire',  status: 'en attente',  type: 'SFTP',      level: 'medium' },
              { name: 'Registre Commerce', status: 'déconnecté',  type: 'API SOAP',  level: 'low'    },
            ].map(src => {
              const colors = {
                high:   { icon: 'text-blue-600',  badge: 'bg-blue-100 text-blue-700'   },
                medium: { icon: 'text-blue-400',  badge: 'bg-blue-50 text-blue-500'    },
                low:    { icon: 'text-slate-400', badge: 'bg-slate-100 text-slate-500' },
              }[src.level];
              return (
                <div key={src.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database className={`h-5 w-5 ${colors.icon}`} />
                    <div>
                      <p className="font-medium text-gray-800">{src.name}</p>
                      <p className="text-xs text-gray-400">{src.type}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                    {src.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Alertes & Seuils ─────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <form onSubmit={handleSettingsSave} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Alertes & Seuils de Détection</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil de détection de fraude
                <span className="text-xs text-gray-400 ml-1">(0.0 - 1.0, actuel: {settings.fraud_threshold})</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={settings.fraud_threshold}
                onChange={e => setSettings(s => ({ ...s, fraud_threshold: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Sensible (0.0)</span>
                <span className="font-semibold text-blue-600">{settings.fraud_threshold}</span>
                <span>Strict (1.0)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant max par transaction (XOF)</label>
              <input type="number" min="0" value={settings.max_transaction_amount}
                onChange={e => setSettings(s => ({ ...s, max_transaction_amount: parseInt(e.target.value) }))}
                className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email d&apos;alerte</label>
              <input type="email" value={settings.alert_email}
                onChange={e => setSettings(s => ({ ...s, alert_email: e.target.value }))}
                className={inp} placeholder="admin@taxup.gov" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Options Système</h2>
            <ToggleRow
              label="Mode maintenance"
              desc="Bloque l'accès des utilisateurs non-admin"
              active={settings.maintenance_mode}
              danger
              onToggle={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
            />
            <ToggleRow
              label="Audit automatique"
              desc="Déclenche automatiquement des audits sur les transactions suspectes"
              active={settings.auto_audit_enabled}
              onToggle={() => setSettings(s => ({ ...s, auto_audit_enabled: !s.auto_audit_enabled }))}
            />
          </div>

          {settingsMsg && (
            <div className={`rounded-lg px-4 py-3 text-sm ${settingsMsg.includes('succ') ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {settingsMsg}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={fetchSettings}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors">
              <RefreshCw className="h-4 w-4" /> Réinitialiser
            </button>
            <button type="submit" disabled={settingsSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors">
              <Save className="h-4 w-4" /> {settingsSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}



      {/* ── Tab: Sécurité ─────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Paramètres de Sécurité</h2>
            <ToggleRow label="Authentification à deux facteurs (2FA)" desc="Exiger la 2FA pour tous les administrateurs" active={true} onToggle={() => {}} />
            <ToggleRow label="Verrouillage de session" desc="Déconnexion automatique après 30 minutes d'inactivité" active={true} onToggle={() => {}} />
            <ToggleRow label="Journalisation des accès" desc="Enregistrer toutes les actions des utilisateurs" active={true} onToggle={() => {}} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée de session max (minutes)</label>
              <input type="number" defaultValue={30} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tentatives de connexion max</label>
              <input type="number" defaultValue={5} className={inp} />
            </div>
          </div>
          <SaveBtn />
        </div>
      )}

      {/* ── Tab: Rapports ─────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Configuration des Rapports</h2>
          <div className="space-y-4">
            <ToggleRow label="Rapports automatiques" desc="Générer automatiquement des rapports hebdomadaires" active={true} onToggle={() => {}} />
            <ToggleRow label="Envoi par email" desc="Envoyer les rapports par email aux administrateurs" active={false} onToggle={() => {}} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence des rapports</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Quotidien</option><option>Hebdomadaire</option><option>Mensuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format d&apos;export par défaut</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>PDF</option><option>Excel (XLSX)</option><option>CSV</option>
              </select>
            </div>
          </div>
          <SaveBtn />
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                  <input type="text" required value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Mot de passe {editingUser ? '(optionnel)' : '*'}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required={!editingUser}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" />
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                  <input type="tel" value={form.phone_number}
                    onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Département</label>
                  <input type="text" value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors">
                  {saving ? 'Enregistrement...' : (editingUser ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
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

// ─── Composants partagés ─────────────────────────────────────────────────────

function SaveBtn() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
    >
      <Save className="h-4 w-4" /> Enregistrer
    </button>
  );
}

function ToggleRow({ label, desc, active, danger = false, onToggle }: {
  label: string; desc: string; active: boolean; danger?: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between cursor-pointer group py-1" onClick={onToggle}>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
        active ? (danger ? 'bg-red-500' : 'bg-blue-600') : 'bg-gray-300'
      }`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}