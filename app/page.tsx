'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Shield,
  BarChart3,
  FileCheck,
  Smartphone,
  Building2,
  Users,
  CheckCircle,
  Receipt,
  TrendingUp,
  Zap,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const stats = [
  { value: '15M+', label: 'Transactions/mois' },
  { value: '99.9%', label: 'Disponibilite' },
  { value: '<100ms', label: 'Temps de reponse' },
  { value: '5', label: 'Profils' },
];

const features = [
  {
    icon: BarChart3,
    title: 'Monitoring Temps Reel',
    description: 'Suivez chaque transaction Mobile Money en temps reel avec des tableaux de bord interactifs.',
    gradient: 'from-[#00853F] to-[#006830]',
  },
  {
    icon: Shield,
    title: 'Detection Fraude IA',
    description: 'Algorithmes intelligents pour identifier automatiquement les anomalies suspectes.',
    gradient: 'from-red-500 to-red-700',
  },
  {
    icon: FileCheck,
    title: 'Recus Fiscaux',
    description: 'Generation automatique de recus fiscaux conformes aux normes senegalaises.',
    gradient: 'from-amber-500 to-amber-700',
  },
  {
    icon: TrendingUp,
    title: 'Analyse Revenus',
    description: 'Visualisez les tendances et analysez les revenus fiscaux detailles.',
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    icon: Lock,
    title: 'Securite Avancee',
    description: 'Chiffrement de bout en bout et authentification multi-facteurs.',
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    icon: Zap,
    title: 'Performance Optimale',
    description: 'Infrastructure haute disponibilite pour une experience fluide.',
    gradient: 'from-orange-500 to-orange-700',
  },
];

const profiles = [
  {
    icon: Users,
    name: 'Citoyen',
    description: 'Consultez vos transactions et telechargez vos recus fiscaux',
    gradient: 'from-[#00853F] to-[#006830]',
  },
  {
    icon: Smartphone,
    name: 'Operateur Mobile',
    description: 'Gerez les transactions et assurez la conformite',
    gradient: 'from-amber-500 to-amber-700',
  },
  {
    icon: Receipt,
    name: 'Auditeur Fiscal',
    description: 'Controlez les operations et menez des audits',
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    icon: Building2,
    name: 'Agent DGID',
    description: 'Supervisez la conformite et analysez les revenus',
    gradient: 'from-slate-600 to-slate-800',
  },
  {
    icon: Shield,
    name: 'Administrateur',
    description: 'Administration complete de la plateforme',
    gradient: 'from-red-500 to-red-700',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#00853F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Senegal flag accent stripe */}
      <div className="flex h-1 fixed top-0 left-0 right-0 z-50">
        <div className="flex-1 bg-[#00853F]" />
        <div className="flex-1 bg-[#FDEF42]" />
        <div className="flex-1 bg-[#E31B23]" />
      </div>

      {/* Hero Section */}
      <section className="relative bg-slate-900 min-h-screen flex flex-col pt-1">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00853F]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-[#00853F]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-slate-700/40 rounded-full blur-3xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center p-2 shadow-lg">
                  <img src="/taxup-logo.svg" alt="TAXUP" className="h-full w-full" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">TAXUP</span>
                  <p className="text-xs text-slate-400 leading-none">Senegal Fiscal Digital</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-8">
                <a href="#fonctionnalites" className="text-sm text-slate-400 hover:text-white transition-colors">Fonctionnalites</a>
                <a href="#profils" className="text-sm text-slate-400 hover:text-white transition-colors">Profils</a>
                <a href="#contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</a>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#00853F] hover:bg-[#006830] text-white font-semibold px-6 py-2.5 rounded-full transition-colors shadow-lg shadow-[#00853F]/25"
              >
                Connexion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - Text */}
              <div>
                <div className="inline-flex items-center gap-2 bg-[#00853F]/15 border border-[#00853F]/30 rounded-full px-4 py-2 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-[#00853F] animate-pulse" />
                  <span className="text-sm text-[#4ade80] font-medium">Plateforme Nationale de Fiscalite Digitale</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Audit fiscal des{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00853F] to-[#4ade80]">
                    transactions
                  </span>{' '}
                  Mobile Money
                </h1>

                <p className="text-lg text-slate-400 mb-8 max-w-xl leading-relaxed">
                  Surveillez, auditez et securisez les transactions financieres electroniques au Senegal avec une plateforme moderne et fiable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-[#00853F] hover:bg-[#006830] text-white font-semibold px-8 py-4 rounded-full transition-colors shadow-xl shadow-[#00853F]/25"
                  >
                    Acceder a la plateforme
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Creer un compte
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 text-xs mr-2">Integre avec :</span>
                  {['Orange Money', 'Wave', 'Free Money'].map((name) => (
                    <span key={name} className="text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right side - Stats cards */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map(({ value, label }, i) => (
                  <div
                    key={label}
                    className={`rounded-2xl p-6 border transition-colors ${
                      i === 0
                        ? 'bg-[#00853F]/10 border-[#00853F]/30 hover:bg-[#00853F]/15'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`text-3xl sm:text-4xl font-bold mb-1 ${i === 0 ? 'text-[#4ade80]' : 'text-white'}`}>{value}</div>
                    <div className="text-sm text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-slate-500">Defiler</span>
            <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-slate-500 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-[#00853F]/10 text-[#00853F] rounded-full px-4 py-2 text-sm font-medium mb-4 border border-[#00853F]/20">
              <Zap className="h-4 w-4" />
              Fonctionnalites
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Une solution complete pour la fiscalite digitale
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Tous les outils necessaires pour gerer efficacement la fiscalite des transactions Mobile Money
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, gradient }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profiles Section */}
      <section id="profils" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              Profils
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Une interface adaptee a chaque role
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Des tableaux de bord personnalises pour repondre aux besoins specifiques de chaque utilisateur
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {profiles.map(({ icon: Icon, name, description, gradient }) => (
              <div
                key={name}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
        {/* Senegal flag bar at top */}
        <div className="absolute top-0 left-0 right-0 flex h-1">
          <div className="flex-1 bg-[#00853F]" />
          <div className="flex-1 bg-[#FDEF42]" />
          <div className="flex-1 bg-[#E31B23]" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#00853F]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-slate-700/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#00853F]/15 border border-[#00853F]/30 rounded-full px-4 py-2 mb-6">
            <CheckCircle className="h-4 w-4 text-[#4ade80]" />
            <span className="text-sm text-[#4ade80] font-medium">Systeme operationnel</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pret a moderniser la fiscalite de votre organisation ?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Rejoignez la plateforme nationale de surveillance des transactions Mobile Money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#00853F] hover:bg-[#006830] text-white font-semibold px-8 py-4 rounded-full transition-colors shadow-xl shadow-[#00853F]/25"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white/5 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors border border-white/10"
            >
              Creer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5">
                <img src="/taxup-logo.svg" alt="TAXUP" className="h-full w-full" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">TAXUP</span>
                <p className="text-xs text-slate-500">Systeme Fiscal Digital du Senegal</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Mentions legales</a>
              <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Confidentialite</a>
              <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#00853F]" />
              <span className="text-sm text-slate-500">Systeme operationnel</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-600">
              {new Date().getFullYear()} TAXUP — Direction Generale des Impots et Domaines du Senegal. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
