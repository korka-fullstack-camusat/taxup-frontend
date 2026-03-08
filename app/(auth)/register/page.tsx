'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const ROLES = [
  { value: 'CITOYEN', label: 'Citoyen' },
  { value: 'OPERATEUR_MOBILE', label: 'Opérateur Mobile' },
  { value: 'AUDITEUR_FISCAL', label: 'Auditeur Fiscal' },
  { value: 'AGENT_DGID', label: 'Agent DGID' },
];

function getPasswordChecks(password: string) {
  return [
    { label: 'Au moins 8 caractères', ok: password.length >= 8 },
    { label: 'Une lettre majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Une lettre minuscule', ok: /[a-z]/.test(password) },
    { label: 'Un chiffre', ok: /\d/.test(password) },
    { label: 'Un caractère spécial (!@#$%^&*...)', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // optional
  return /^\+?[0-9]{8,15}$/.test(phone);
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    organization: '',
    role: 'CITOYEN',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const passwordChecks = getPasswordChecks(form.password);
  const passwordValid = passwordChecks.every((c) => c.ok);
  const phoneValid = validatePhone(form.phone_number);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les critères requis.');
      return;
    }
    if (!phoneValid) {
      setFieldErrors({ phone_number: 'Format invalide. Utilisez uniquement des chiffres et + (ex: +224600000000)' });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.phone_number) delete (payload as Partial<typeof payload>).phone_number;
      if (!payload.organization) delete (payload as Partial<typeof payload>).organization;
      await register(payload);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; errors?: { field: string; message: string }[] } } };
      const data = axiosErr.response?.data;
      if (data?.errors) {
        const fe: Record<string, string> = {};
        data.errors.forEach(({ field, message }: { field: string; message: string }) => {
          const key = field.replace('body -> ', '');
          fe[key] = message;
        });
        setFieldErrors(fe);
      } else {
        setError(data?.detail || "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 p-4 rounded-full mb-3">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Créer un compte TAXUP</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="jean_dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="jean@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 space-y-1">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5 text-xs">
                    {check.ok
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                    <span className={check.ok ? 'text-green-600' : 'text-red-400'}>{check.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  fieldErrors.phone_number ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="+224600000000"
              />
              {fieldErrors.phone_number && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
            <input
              name="organization"
              value={form.organization}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nom de votre organisation"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !passwordValid || !phoneValid}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-semibold transition-colors"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
