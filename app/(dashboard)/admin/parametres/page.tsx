'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Users, FileText, Database, AlertTriangle, Palette, Shield, BarChart3,
  Plus, Edit2, Trash2, Save, RefreshCw, X, Eye, EyeOff, Key, Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

// Types
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
  { value: 'ADMIN', label: 'Administrateur' },
  { value: 'AGENT_DGID', label: 'Analyste Senior' },
  { value: 'AUDITEUR_FISCAL', label: 'Auditeur' },
  { value: 'OPERATEUR_MOBILE', label: 'Op\u00e9rateur' },
  { value: 'CITOYEN', label: 'Superviseur' },
];
const roleLabelMap: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));
const roleColorMap: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', AGENT_DGID: 'bg-blue-100 text-blue-700',
  AUDITEUR_FISCAL: 'bg-purple-100 text-purple-700', OPERATEUR_MOBILE: 'bg-yellow-100 text-yellow-700',
  CITOYEN: 'bg-emerald-100 text-emerald-700',
};
const emptyForm: UserForm = { username: '', email: '', password: '', full_name: '', role: 'CITOYEN', phone_number: '', organization: '' };

type Tab = 'users' | 'fiscal' | 'sources' | 'alerts' | 'custom' | 'security' | 'reports';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'users', label: 'Gestion Utilisateurs', icon: Users },
  { id: 'fiscal', label: 'R\u00e8gles Fiscales', icon: FileText },
  { id: 'sources', label: 'Sources de Donn\u00e9es', icon: Database },
  { id: 'alerts', label: 'Alertes & Seuils', icon: AlertTriangle },
  { id: 'custom', label: 'Personnalisation', icon: Palette },
  { id: 'security', label: 'S\u00e9curit\u00e9', icon: Shield },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
];

export default function ParametresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // Users state
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

  // Settings state
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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setUsersLoading(true);
    try {
      const res = await api.get('/users', { params: { page_size: 100 } });
      setUsers(res.data.items || res.data || []);
    } catch { setUsers([]); } finally { setUsersLoading(false); }
  }, [user]);

  // Fetch settings
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
    try { await api.put('/admin/settings', settings); setSettingsMsg('Param\u00e8tres enregistr\u00e9s avec succ\u00e8s.'); }
    catch { setSettingsMsg('Erreur lors de la sauvegarde.'); }
    finally { setSettingsSaving(false); }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 rounded-xl">
          <Settings className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Param\u00e8tres du tableau de bord TAXUP</h1>
        </div>
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
                  activeTab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">1. Gestion des utilisateurs et des r\u00f4les</h2>
            <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
              <Plus className="h-4 w-4" /> Nouvel Utilisateur
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {usersLoading ? (
              <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
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
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                              {u.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{u.full_name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{roleLabelMap[u.role] || u.role}</td>
                        <td className="px-6 py-4 text-gray-500">{u.organization || 'Direction G\u00e9n\u00e9rale'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-600"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MFA & Audit Log cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-emerald-600" /> Authentification Forte (MFA)
              </h3>
              <p className="text-sm text-gray-500 mb-4">Activez l&apos;authentification \u00e0 deux facteurs pour renforcer la s\u00e9curit\u00e9 des comptes.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">MFA activ\u00e9 pour les admins</span>
                <div className="relative w-11 h-6 rounded-full bg-emerald-500 cursor-pointer">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5 transition-transform" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" /> Journal d&apos;Audit
              </h3>
              <p className="text-sm text-gray-500 mb-4">Consultez l&apos;historique des actions effectu\u00e9es sur la plateforme.</p>
              <div className="space-y-2">
                {['Connexion admin', 'Modification param\u00e8tres', 'Cr\u00e9ation utilisateur'].map((action, i) => (
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

      {activeTab === 'fiscal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">R\u00e8gles Fiscales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA standard (%)</label>
              <input type="number" defaultValue={18} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux r\u00e9duit (%)</label>
              <input type="number" defaultValue={10} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">P\u00e9riode fiscale</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Trimestriel</option>
                <option>Mensuel</option>
                <option>Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>XOF (Franc CFA)</option>
                <option>EUR (Euro)</option>
                <option>USD (Dollar)</option>
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Sources de Donn\u00e9es</h2>
          <div className="space-y-4">
            {[
              { name: 'API Mobile Money', status: 'connect\u00e9', type: 'API REST', color: 'emerald' },
              { name: 'Base DGID', status: 'connect\u00e9', type: 'Database', color: 'emerald' },
              { name: 'Syst\u00e8me Bancaire', status: 'en attente', type: 'SFTP', color: 'yellow' },
              { name: 'Registre Commerce', status: 'd\u00e9connect\u00e9', type: 'API SOAP', color: 'red' },
            ].map(src => (
              <div key={src.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Database className={`h-5 w-5 ${src.color === 'emerald' ? 'text-emerald-600' : src.color === 'yellow' ? 'text-yellow-600' : 'text-red-500'}`} />
                  <div>
                    <p className="font-medium text-gray-800">{src.name}</p>
                    <p className="text-xs text-gray-400">{src.type}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  src.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  src.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                }`}>
                  {src.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <form onSubmit={handleSettingsSave} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">Alertes & Seuils de D\u00e9tection</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil de d\u00e9tection de fraude <span className="text-xs text-gray-400">(0.0 - 1.0, actuel: {settings.fraud_threshold})</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={settings.fraud_threshold}
                onChange={e => setSettings(s => ({ ...s, fraud_threshold: parseFloat(e.target.value) }))} className="w-full accent-emerald-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Sensible (0.0)</span><span className="font-semibold text-emerald-600">{settings.fraud_threshold}</span><span>Strict (1.0)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant max par transaction (XOF)</label>
              <input type="number" min="0" value={settings.max_transaction_amount}
                onChange={e => setSettings(s => ({ ...s, max_transaction_amount: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email d&apos;alerte</label>
              <input type="email" value={settings.alert_email}
                onChange={e => setSettings(s => ({ ...s, alert_email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="admin@taxup.gov" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Options Syst\u00e8me</h2>
            <ToggleRow label="Mode maintenance" desc="Bloque l'acc\u00e8s des utilisateurs non-admin"
              active={settings.maintenance_mode} color="red"
              onToggle={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))} />
            <ToggleRow label="Audit automatique" desc="D\u00e9clenche automatiquement des audits sur les transactions suspectes"
              active={settings.auto_audit_enabled} color="emerald"
              onToggle={() => setSettings(s => ({ ...s, auto_audit_enabled: !s.auto_audit_enabled }))} />
          </div>
          {settingsMsg && (
            <div className={`rounded-lg px-4 py-3 text-sm ${settingsMsg.includes('succ') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {settingsMsg}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={fetchSettings} className="flex items-center gap-2 border border-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" /> R\u00e9initialiser
            </button>
            <button type="submit" disabled={settingsSaving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg px-6 py-2.5 text-sm font-semibold">
              <Save className="h-4 w-4" /> {settingsSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'custom' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Personnalisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la plateforme</label>
              <input type="text" defaultValue="TAXUP" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
              <input type="color" defaultValue="#10b981" className="h-10 w-full rounded-lg border border-gray-200 cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Langue par d\u00e9faut</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Fran\u00e7ais</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Africa/Dakar (GMT+0)</option>
                <option>Europe/Paris (GMT+1)</option>
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Param\u00e8tres de S\u00e9curit\u00e9</h2>
            <ToggleRow label="Authentification \u00e0 deux facteurs (2FA)" desc="Exiger la 2FA pour tous les administrateurs" active={true} color="emerald" onToggle={() => {}} />
            <ToggleRow label="Verrouillage de session" desc="D\u00e9connexion automatique apr\u00e8s 30 minutes d'inactivit\u00e9" active={true} color="emerald" onToggle={() => {}} />
            <ToggleRow label="Journalisation des acc\u00e8s" desc="Enregistrer toutes les actions des utilisateurs" active={true} color="emerald" onToggle={() => {}} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dur\u00e9e de session max (minutes)</label>
              <input type="number" defaultValue={30} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tentatives de connexion max</label>
              <input type="number" defaultValue={5} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Configuration des Rapports</h2>
          <div className="space-y-4">
            <ToggleRow label="Rapports automatiques" desc="G\u00e9n\u00e9rer automatiquement des rapports hebdomadaires" active={true} color="emerald" onToggle={() => {}} />
            <ToggleRow label="Envoi par email" desc="Envoyer les rapports par email aux administrateurs" active={false} color="emerald" onToggle={() => {}} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fr\u00e9quence des rapports</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Quotidien</option>
                <option>Hebdomadaire</option>
                <option>Mensuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format d&apos;export par d\u00e9faut</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>PDF</option>
                <option>Excel (XLSX)</option>
                <option>CSV</option>
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
                  <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                  <input type="text" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mot de passe {editingUser ? '(optionnel)' : '*'}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required={!editingUser} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">R\u00f4le *</label>
                  <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">T\u00e9l\u00e9phone</label>
                  <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">D\u00e9partement</label>
                  <input type="text" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
            <p className="text-sm text-gray-600 mb-5">\u00cates-vous s\u00fbr de vouloir supprimer <span className="font-semibold">{deleteTarget.full_name}</span> ?</p>
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

function ToggleRow({ label, desc, active, color, onToggle }: {
  label: string; desc: string; active: boolean; color: string; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between cursor-pointer group" onClick={onToggle}>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors ${active ? (color === 'red' ? 'bg-red-500' : 'bg-emerald-500') : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}
