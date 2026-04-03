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


const features = [
  {
    icon: BarChart3,
    title: 'Monitoring Temps Reel',
    description: 'Suivez chaque transaction Mobile Money en temps reel avec des tableaux de bord interactifs.',
    gradient: 'from-[#00853F] to-[#006830]',
  },
  {
    icon: Shield,
    title: 'Detection de Fraude',
    description: 'Algorithmes avances pour identifier automatiquement les anomalies et transactions suspectes.',
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
        <nav className="sticky top-1 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
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

              {/* Right side - Dashboard mockup */}
              <div className="relative hidden lg:block">
                <div className="absolute -inset-4 bg-[#00853F]/15 rounded-3xl blur-3xl" />
                <div className="relative bg-slate-800 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">

                  {/* Browser chrome */}
                  <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-3 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00853F]/80" />
                    </div>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-5 flex items-center px-3">
                      <span className="text-[9px] text-slate-500">taxup.sn/dashboard</span>
                    </div>
                  </div>

                  {/* Dashboard content */}
                  <div className="p-4 space-y-3">

                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-white">Tableau de Bord DGID</p>
                        <p className="text-[9px] text-slate-400">Bienvenue, Agent DGID</p>
                      </div>
                      <span className="bg-[#00853F]/20 text-[#4ade80] text-[9px] px-2 py-0.5 rounded-full border border-[#00853F]/30">● En ligne</span>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#00853F]/10 border border-[#00853F]/20 rounded-xl p-2.5">
                        <p className="text-[9px] text-slate-400">Transactions</p>
                        <p className="text-sm font-bold text-white mt-0.5">2 847</p>
                        <p className="text-[9px] text-[#4ade80]">↑ +12% ce mois</p>
                      </div>
                      <div className="bg-slate-700/40 rounded-xl p-2.5">
                        <p className="text-[9px] text-slate-400">TVA Collectee</p>
                        <p className="text-sm font-bold text-white mt-0.5">48.2M XOF</p>
                        <p className="text-[9px] text-[#4ade80]">↑ +8%</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                        <p className="text-[9px] text-slate-400">Alertes Fraude</p>
                        <p className="text-sm font-bold text-red-400 mt-0.5">14</p>
                        <p className="text-[9px] text-orange-400">⚠ A traiter</p>
                      </div>
                      <div className="bg-slate-700/40 rounded-xl p-2.5">
                        <p className="text-[9px] text-slate-400">Audits actifs</p>
                        <p className="text-sm font-bold text-white mt-0.5">6</p>
                        <p className="text-[9px] text-slate-500">en cours</p>
                      </div>
                    </div>

                    {/* Mini bar chart */}
                    <div className="bg-slate-700/30 rounded-xl p-3">
                      <p className="text-[9px] text-slate-400 mb-2">Evolution transactions — 7 derniers jours</p>
                      <div className="flex items-end gap-1.5 h-14">
                        {[40, 65, 45, 80, 55, 95, 70].map((h, i) => (
                          <div key={i} className="flex-1 flex items-end">
                            <div
                              className={`w-full rounded-t-sm transition-all ${i === 5 ? 'bg-[#00853F]' : 'bg-slate-600'}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex mt-1">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                          <span key={i} className="flex-1 text-center text-[8px] text-slate-500">{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Mini transaction list */}
                    <div>
                      <p className="text-[9px] text-slate-400 mb-1.5">Transactions recentes</p>
                      <div className="space-y-1.5">
                        {[
                          { type: 'Transfert', phone: '+221 77 xxx xxxx', amount: '25 000', ok: true },
                          { type: 'Paiement mobile', phone: '+221 78 xxx xxxx', amount: '12 500', ok: false },
                          { type: 'Depot', phone: '+221 76 xxx xxxx', amount: '50 000', ok: true },
                        ].map((tx, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-2.5 py-1.5">
                            <div>
                              <p className="text-[9px] font-medium text-white">{tx.type}</p>
                              <p className="text-[8px] text-slate-500">{tx.phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-white">{tx.amount} XOF</p>
                              <p className={`text-[8px] ${tx.ok ? 'text-[#4ade80]' : 'text-amber-400'}`}>
                                {tx.ok ? '● Complete' : '● En attente'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
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
