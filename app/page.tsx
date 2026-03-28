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
  ChevronRight,
  Play,
  CheckCircle,
  Globe,
  Lock,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const metrics = [
  { value: '15M+', label: 'Transactions traitees', sublabel: 'par mois' },
  { value: '99.9%', label: 'Disponibilite', sublabel: 'garantie' },
  { value: '<100ms', label: 'Temps de reponse', sublabel: 'moyen' },
  { value: '5', label: 'Profils utilisateurs', sublabel: 'specialises' },
];

const features = [
  { 
    icon: BarChart3, 
    title: 'Monitoring en temps reel',
    description: 'Tableaux de bord dynamiques pour suivre chaque transaction Mobile Money instantanement.',
    highlight: 'Live'
  },
  { 
    icon: Shield, 
    title: 'Detection de fraude IA',
    description: 'Algorithmes intelligents pour identifier les anomalies et patterns suspects automatiquement.',
    highlight: 'IA'
  },
  { 
    icon: FileCheck, 
    title: 'Recus fiscaux certifies',
    description: 'Generation automatique de recus conformes aux normes fiscales senegalaises.',
    highlight: 'Certifie'
  },
];

const profiles = [
  { 
    icon: Users,
    name: 'Citoyen',
    description: 'Consultez vos transactions et telechargez vos recus fiscaux',
    color: 'bg-emerald-500'
  },
  { 
    icon: Smartphone,
    name: 'Operateur Mobile',
    description: 'Gerez les transactions et assurez la conformite reglementaire',
    color: 'bg-blue-500'
  },
  { 
    icon: FileCheck,
    name: 'Auditeur Fiscal',
    description: 'Controlez les operations et menez des audits approfondis',
    color: 'bg-amber-500'
  },
  { 
    icon: Building2,
    name: 'Agent DGID',
    description: 'Supervisez la conformite et analysez les revenus fiscaux',
    color: 'bg-purple-500'
  },
  { 
    icon: Shield,
    name: 'Administrateur',
    description: 'Administration complete de la plateforme et des acces',
    color: 'bg-slate-700'
  },
];

const trustedBy = [
  'Orange Money',
  'Wave',
  'Free Money',
  'Wizall Money'
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-white">T</span>
          </div>
          <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-[loading_1s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-base font-bold text-white">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TAXUP</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalites</a>
              <a href="#profils" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Profils</a>
              <a href="#securite" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Securite</a>
            </div>
            
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-full transition-colors text-sm"
            >
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Announcement badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-700 font-medium">Plateforme Nationale de Fiscalite Digitale</span>
              <ChevronRight className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          
          {/* Main headline */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Audit fiscal des
              <span className="block text-blue-600">transactions Mobile Money</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Surveillez, auditez et securisez les transactions financieres electroniques avec une plateforme moderne et fiable.
            </p>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-blue-600/25 text-base"
            >
              Acceder a la plateforme
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-8 py-4 rounded-full transition-colors text-base">
              <Play className="h-5 w-5" />
              Voir la demo
            </button>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {metrics.map(({ value, label, sublabel }) => (
              <div key={label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{value}</div>
                <div className="text-sm text-gray-600">{label}</div>
                <div className="text-xs text-gray-400">{sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by section */}
      <section className="py-12 px-6 lg:px-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-500 mb-6">Partenaires et operateurs integres</p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {trustedBy.map((name) => (
              <div key={name} className="text-lg font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Feature cards */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, title, description, highlight }, index) => (
                <button
                  key={title}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                    activeFeature === index 
                      ? 'border-blue-600 bg-blue-50/50 shadow-lg' 
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activeFeature === index ? 'bg-blue-600' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${activeFeature === index ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          activeFeature === index ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {highlight}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Right - Visual display */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
                
                {/* Animated dashboard preview */}
                <div className="relative w-full max-w-sm">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 transform transition-all duration-500">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Volume total</div>
                        <div className="text-2xl font-bold text-gray-900">2.4M FCFA</div>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm font-medium">
                        <TrendingUp className="h-4 w-4" />
                        +12.5%
                      </div>
                    </div>
                    
                    {/* Mini chart bars */}
                    <div className="flex items-end gap-2 h-24 mb-4">
                      {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-blue-100 rounded-t-lg transition-all duration-500"
                          style={{ height: `${height}%` }}
                        >
                          <div 
                            className="w-full bg-blue-600 rounded-t-lg transition-all duration-700"
                            style={{ height: activeFeature === 0 ? '100%' : '60%' }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Transactions', value: '1,247' },
                        { label: 'Alertes', value: '3' },
                        { label: 'Recus', value: '892' }
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                          <div className="text-lg font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-500">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles Section */}
      <section id="profils" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Une interface pour chaque role
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Des tableaux de bord personnalises adaptes aux besoins specifiques de chaque utilisateur
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {profiles.map(({ icon: Icon, name, description, color }) => (
              <div
                key={name}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="securite" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 lg:p-16 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            
            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Securite de niveau bancaire
                </h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Vos donnees sont protegees par les standards de securite les plus stricts de l&apos;industrie financiere.
                </p>
                
                <div className="space-y-4">
                  {[
                    { icon: Lock, text: 'Chiffrement AES-256 de bout en bout' },
                    { icon: Shield, text: 'Authentification multi-facteurs' },
                    { icon: Globe, text: 'Infrastructure certifiee ISO 27001' },
                    { icon: Zap, text: 'Monitoring securite 24/7' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="text-gray-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/50">
                        <Shield className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>
                  {/* Animated rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-4 rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Pret a moderniser votre fiscalite ?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez la plateforme nationale de surveillance des transactions Mobile Money et assurez la conformite fiscale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-full hover:bg-blue-50 transition-colors text-base shadow-xl"
            >
              Commencer maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-400 transition-colors text-base border border-blue-400"
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
            
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} TAXUP - Tous droits reserves
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
