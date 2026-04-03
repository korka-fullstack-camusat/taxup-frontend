'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, AtSign, User, ArrowLeft, Shield, Zap } from 'lucide-react';
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
        setError(data?.detail || 'Identifiants incorrects. Verifiez votre email/username et mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-700 via-green-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0 flex">
              <div className="flex-1 bg-[#00853F] flex items-center justify-center">
                <span className="text-sm font-black text-white">T</span>
              </div>
              <div className="flex-1 bg-[#FDEF42] flex items-center justify-center">
                <span className="text-[10px] text-[#00853F] font-bold">★</span>
              </div>
              <div className="flex-1 bg-[#E31B23]" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">TAXUP</span>
              <p className="text-sm text-green-200">Systeme Fiscal Digital</p>
            </div>
          </Link>
          
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                Plateforme Nationale<br />
                d&apos;Audit Digital Fiscal
              </h1>
              <p className="text-green-100/80 text-lg max-w-md">
                Acces securise a la supervision des transactions Mobile Money et a la conformite fiscale.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Securite renforcee</p>
                  <p className="text-green-200 text-sm">Chiffrement de bout en bout</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Acces instantane</p>
                  <p className="text-green-200 text-sm">Connexion rapide et fiable</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-green-300/60 text-sm">
            {new Date().getFullYear()} TAXUP - Tous droits reserves
          </p>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden bg-gradient-to-br from-green-700 to-green-900 px-4 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0 flex">
              <div className="flex-1 bg-[#00853F] flex items-center justify-center">
                <span className="text-xs font-black text-white">T</span>
              </div>
              <div className="flex-1 bg-[#FDEF42] flex items-center justify-center">
                <span className="text-[8px] text-[#00853F] font-bold">★</span>
              </div>
              <div className="flex-1 bg-[#E31B23]" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">TAXUP</span>
              <p className="text-xs text-green-200">Systeme Fiscal Digital</p>
            </div>
          </Link>
        </div>
        {/* Senegal flag accent bar */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#00853F]" />
          <div className="flex-1 bg-[#FDEF42]" />
          <div className="flex-1 bg-[#E31B23]" />
        </div>
        
        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            {/* Back link - desktop */}
            <Link 
              href="/"
              className="hidden lg:inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour a l&apos;accueil
            </Link>
            
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
                <p className="text-gray-500">Connectez-vous a votre compte TAXUP</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email ou nom d&apos;utilisateur
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {isEmail ? <AtSign className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition bg-gray-50 hover:bg-white focus:bg-white"
                      placeholder="email@exemple.com ou username"
                      autoComplete="username"
                      required
                    />
                  </div>
                  {identifier && (
                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                      {isEmail ? (
                        <>
                          <AtSign className="h-3 w-3" />
                          Connexion par adresse email
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          Connexion par nom d&apos;utilisateur
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition pr-12 bg-gray-50 hover:bg-white focus:bg-white"
                      placeholder="Entrez votre mot de passe"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white rounded-xl py-4 font-semibold transition-colors shadow-lg shadow-green-700/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>
            </div>

            {/* Help section */}
            <div className="mt-6 bg-green-50 rounded-2xl p-5 border border-green-100">
              <p className="text-sm font-semibold text-green-900 mb-3">Comment se connecter ?</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <AtSign className="h-3.5 w-3.5 text-green-700" />
                  </div>
                  <span className="text-gray-600">
                    Avec votre <span className="font-medium text-gray-900">adresse email</span>
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 text-green-700" />
                  </div>
                  <span className="text-gray-600">
                    Ou votre <span className="font-medium text-gray-900">nom d&apos;utilisateur</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-green-100">
                Acces reserve aux utilisateurs autorises. Contactez votre administrateur pour obtenir un compte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
