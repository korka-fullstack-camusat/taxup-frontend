'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface PlatformSettings {
  fraud_threshold: number;
  max_transaction_amount: number;
  alert_email: string;
  maintenance_mode: boolean;
  auto_audit_enabled: boolean;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings>({
    fraud_threshold: 0.8,
    max_transaction_amount: 10000000,
    alert_email: '',
    maintenance_mode: false,
    auto_audit_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await api.put('/admin/settings', settings);
      setSuccess('Paramètres enregistrés avec succès.');
    } catch {
      setError('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="h-6 w-6 text-green-600" />
          Paramètres de la plateforme
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configurez les paramètres globaux de TAXUP</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Détection de fraude</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil de détection de fraude
                <span className="ml-2 text-xs text-gray-400">(0.0 - 1.0, actuel: {settings.fraud_threshold})</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.fraud_threshold}
                onChange={e => setSettings(s => ({ ...s, fraud_threshold: parseFloat(e.target.value) }))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Sensible (0.0)</span>
                <span className="font-semibold text-green-600">{settings.fraud_threshold}</span>
                <span>Strict (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant max par transaction (GNF)
              </label>
              <input
                type="number"
                min="0"
                value={settings.max_transaction_amount}
                onChange={e => setSettings(s => ({ ...s, max_transaction_amount: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Notifications & Alertes</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email d&apos;alerte système</label>
              <input
                type="email"
                value={settings.alert_email}
                onChange={e => setSettings(s => ({ ...s, alert_email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="admin@taxup.gov"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Options système</h2>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-gray-700">Mode maintenance</p>
                <p className="text-xs text-gray-400">Bloque l&apos;accès des utilisateurs non-admin</p>
              </div>
              <div
                onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-5' : ''}`} />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-gray-700">Audit automatique</p>
                <p className="text-xs text-gray-400">Déclenche automatiquement des audits sur les transactions suspectes</p>
              </div>
              <div
                onClick={() => setSettings(s => ({ ...s, auto_audit_enabled: !s.auto_audit_enabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.auto_audit_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.auto_audit_enabled ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchSettings}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
