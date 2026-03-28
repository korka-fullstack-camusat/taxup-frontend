'use client';

import { useEffect, useState } from 'react';
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
    description: 'Suivez chaque transaction Mobile Money en temps reel avec des tableaux de bord interactifs et des indicateurs cles.',
  },
  { 
    icon: Shield, 
    title: 'Detection Fraude IA',
    description: 'Algorithmes intelligents pour identifier automatiquement les anomalies et les comportements suspects.',
  },
  { 
    icon: FileCheck, 
    title: 'Recus Fiscaux',
    description: 'Generation automatique de recus fiscaux conformes aux normes reglementaires senegalaises.',
  },
  { 
    icon: TrendingUp, 
    title: 'Analyse Revenus',
    description: 'Visualisez les tendances et analysez les revenus fiscaux avec des rapports detailles.',
  },
  { 
    icon: Lock, 
    title: 'Securite Avancee',
    description: 'Chiffrement de bout en bout et authentification multi-facteurs pour proteger vos donnees.',
  },
  { 
    icon: Zap, 
    title: 'Performance Optimale',
    description: 'Infrastructure haute disponibilite garantissant une experience utilisateur fluide.',
  },
];

const profiles = [
  { 
    icon: Users,
    name: 'Citoyen',
    description: 'Consultez vos transactions et telechargez vos recus fiscaux',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    icon: Smartphone,
    name: 'Operateur Mobile',
    description: 'Gerez les transactions et assurez la conformite',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    icon: Receipt,
    name: 'Auditeur Fiscal',
    description: 'Controlez les operations et menez des audits',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    icon: Building2,
    name: 'Agent DGID',
    description: 'Supervisez la conformite et analysez les revenus',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    icon: Shield,
    name: 'Administrateur',
    description: 'Administration complete de la plateforme',
    color: 'from-slate-600 to-slate-700'
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center animate-pulse shadow-2xl">
            <span className="text-2xl font-bold text-blue-600">T</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section with Blue Background */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 min-h-screen flex flex-col">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </div>

        {/* Navigation */}
        <nav className={`relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <span className="text-xl font-bold text-blue-600">T</span>
                </div>
                <span className="text-2xl font-bold text-white">TAXUP</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#fonctionnalites" className="text-sm text-blue-100 hover:text-white transition-colors">Fonctionnalites</a>
                <a href="#profils" className="text-sm text-blue-100 hover:text-white transition-colors">Profils</a>
                <a href="#contact" className="text-sm text-blue-100 hover:text-white transition-colors">Contact</a>
              </div>
              
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-semibold px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text */}
              <div className={`transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-white font-medium">Plateforme Nationale de Fiscalite Digitale</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Audit fiscal des transactions{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                    Mobile Money
                  </span>
                </h1>
                
                <p className="text-lg text-blue-100 mb-8 max-w-xl leading-relaxed">
                  Surveillez, auditez et securisez les transactions financieres electroniques au Senegal avec une plateforme moderne et fiable.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-full hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    Acceder a la plateforme
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-500/40 transition-all border border-white/20"
                  >
                    Creer un compte
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-6">
                  {['Orange Money', 'Wave', 'Free Money'].map((name, i) => (
                    <div 
                      key={name} 
                      className={`text-blue-200/80 text-sm font-medium transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ transitionDelay: `${800 + i * 100}ms` }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right side - Stats cards */}
              <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map(({ value, label }, index) => (
                    <div 
                      key={label}
                      className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:bg-white/20 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                      style={{ transitionDelay: `${600 + index * 100}ms` }}
                    >
                      <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{value}</div>
                      <div className="text-sm text-blue-200">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex justify-center">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs text-blue-200">Defiler</span>
            <div className="w-6 h-10 rounded-full border-2 border-blue-200/50 flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-blue-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
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
            {features.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className={`group bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${activeFeature === index ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
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
      <section id="profils" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
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
            {profiles.map(({ icon: Icon, name, description, color }, index) => (
              <div
                key={name}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden relative"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pret a moderniser la fiscalite de votre organisation ?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Rejoignez la plateforme nationale de surveillance des transactions Mobile Money et assurez la conformite fiscale de vos operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-full hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-500/40 transition-all border border-white/20"
            >
              Creer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">T</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">TAXUP</span>
                <p className="text-xs text-gray-500">Systeme Fiscal Digital du Senegal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Mentions legales</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Confidentialite</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-400">Systeme operationnel</span>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} TAXUP - Direction Generale des Impots et Domaines du Senegal. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
