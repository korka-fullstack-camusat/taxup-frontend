'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, AtSign, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const isEmail = identifier.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; errors?: { message: string }[] } } };
      const data = axiosErr.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setError(data.errors.map((e) => e.message).join('. '));
      } else {
        setError(data?.detail || 'Identifiants incorrects. Vérifiez votre email/username et mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <Shield className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TAXUP</h1>
          <p className="text-gray-500 text-sm mt-1">Système de surveillance fiscale</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-6">Connexion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email ou nom d&apos;utilisateur
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isEmail ? <AtSign className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="email@exemple.com ou username"
                autoComplete="username"
                required
              />
            </div>
            {identifier && (
              <p className="text-xs text-gray-400 mt-1">
                {isEmail ? 'Connexion par adresse email' : 'Connexion par nom d\'utilisateur'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg py-3 text-sm font-semibold transition-colors mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Connexion...
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        {/* Info connexion */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment se connecter</p>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <AtSign className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Avec votre <span className="font-medium text-gray-700">adresse email</span> : ex. jean.dupont@dgid.gov.gn</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <User className="h-3.5 w-3.5 mt-0.5 text-green-500 flex-shrink-0" />
            <span>Avec votre <span className="font-medium text-gray-700">nom d&apos;utilisateur</span> : ex. jean.dupont</span>
          </div>
          <p className="text-xs text-gray-400 pt-1 border-t border-gray-200">
            Accès réservé aux utilisateurs autorisés. Contactez votre administrateur pour obtenir un compte.
          </p>
        </div>
      </div>
    </div>
  );
}
