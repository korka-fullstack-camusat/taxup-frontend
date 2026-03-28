'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BarChart2, 
  Shield, 
  FileCheck, 
  Bell, 
  Lock, 
  ArrowRight, 
  CheckCircle2,
  Smartphone,
  Building2,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const features = [
  { 
    icon: BarChart2, 
    title: 'Surveillance temps reel',
    description: 'Monitoring continu des transactions Mobile Money avec tableaux de bord dynamiques'
  },
  { 
    icon: Shield, 
    title: 'Detection de fraude',
    description: 'Algorithmes avances pour identifier les anomalies et comportements suspects'
  },
  { 
    icon: FileCheck, 
    title: 'Recus fiscaux certifies',
    description: 'Generation et verification de recus conformes aux normes fiscales'
  },
  { 
    icon: Bell, 
    title: 'Alertes instantanees',
    description: 'Notifications en temps reel pour les evenements critiques'
  },
  { 
    icon: Lock, 
    title: 'Acces securise',
    description: 'Authentification renforcee et gestion des droits par profil'
  },
  { 
    icon: TrendingUp, 
    title: 'Analyse des revenus',
    description: 'Rapports detailles sur la collecte fiscale et les tendances'
  },
];

const roles = [
  { 
    icon: Users,
    label: 'Citoyen',
    description: 'Consultez vos transactions et recus fiscaux'
  },
  { 
    icon: Smartphone,
    label: 'Operateur Mobile',
    description: 'Gerez les transactions et la conformite'
  },
  { 
    icon: FileCheck,
    label: 'Auditeur Fiscal',
    description: 'Controlez et auditez les operations'
  },
  { 
    icon: Building2,
    label: 'Agent DGID',
    description: 'Supervisez la conformite fiscale'
  },
  { 
    icon: Shield,
    label: 'Administrateur',
    description: 'Gerez la plateforme complete'
  },
];

const stats = [
  { value: '99.9%', label: 'Disponibilite' },
  { value: '< 1s', label: 'Temps de reponse' },
  { value: '256-bit', label: 'Chiffrement' },
  { value: '24/7', label: 'Support' },
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">TAXUP</span>
              <span className="hidden sm:inline text-sm text-gray-500 ml-2">Systeme Fiscal Digital</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20 text-sm"
          >
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-sm text-white/90 mb-6">
                <Zap className="h-4 w-4 text-yellow-400" />
                Plateforme Nationale d&apos;Audit Digital Fiscal
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Audit fiscal des
                <span className="block text-blue-200">transactions Mobile Money</span>
              </h1>
              
              <p className="text-lg text-blue-100/80 max-w-xl mb-8">
                Detection de fraude, conformite fiscale et supervision en temps reel dans une seule plateforme securisee.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base"
                >
                  Acceder a la plateforme
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start">
                {['Securise', 'Conforme', 'Fiable'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-white/80 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Stats cards */}
            <div className="grid grid-cols-2 gap-4 lg:gap-5">
              {stats.map(({ value, label }) => (
                <div 
                  key={label}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-center hover:bg-white/15 transition-colors"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
                  <div className="text-sm text-blue-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalites principales
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Une suite complete d&apos;outils pour la gestion fiscale des transactions electroniques
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Concu pour chaque profil
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Des interfaces adaptees aux besoins specifiques de chaque utilisateur
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {roles.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pret a commencer ?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Connectez-vous a votre espace securise pour acceder a toutes les fonctionnalites de la plateforme.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base"
          >
            Acceder a mon espace
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">T</span>
              </div>
              <span className="text-white font-semibold">TAXUP</span>
            </div>
            <p className="text-slate-500 text-sm">
              {new Date().getFullYear()} TAXUP - Tous droits reserves
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
