'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, CheckCircle, BarChart2, Bell, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const features = [
  { icon: BarChart2, title: 'Surveillance en temps réel', desc: 'Suivez toutes les transactions mobiles avec des tableaux de bord interactifs.' },
  { icon: Shield, title: 'Détection de fraude', desc: 'Algorithmes avancés pour identifier automatiquement les comportements suspects.' },
  { icon: CheckCircle, title: 'Reçus fiscaux automatiques', desc: 'Génération instantanée de reçus fiscaux conformes pour chaque transaction.' },
  { icon: Bell, title: 'Notifications en temps réel', desc: 'Alertes immédiates sur les événements critiques et les seuils dépassés.' },
  { icon: Lock, title: 'Accès sécurisé par rôle', desc: 'Contrôle d\'accès adapté à chaque profil : citoyen, opérateur, auditeur, DGID.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">TAXUP</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-green-600 font-medium transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
            Plateforme de surveillance fiscale
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Surveillance intelligente des<br />
            <span className="text-green-300">transactions mobiles</span>
          </h1>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-10">
            TAXUP centralise la surveillance des transactions mobiles, la détection de fraude et la conformité fiscale en une seule plateforme sécurisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Une plateforme complète</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Tous les outils dont vous avez besoin pour une surveillance fiscale efficace.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Conçu pour chaque profil</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Citoyen', desc: 'Consultez vos transactions et reçus fiscaux personnels.', color: 'blue' },
              { role: 'Opérateur Mobile', desc: 'Gérez les transactions de votre réseau en temps réel.', color: 'purple' },
              { role: 'Auditeur Fiscal', desc: 'Conduisez des audits et analysez les alertes fraude.', color: 'yellow' },
              { role: 'Agent DGID', desc: 'Supervision complète : KPIs, fraude, rapports fiscaux.', color: 'green' },
            ].map(({ role, desc, color }) => (
              <div key={role} className={`rounded-xl p-5 border-2 ${
                color === 'blue' ? 'border-blue-100 bg-blue-50' :
                color === 'purple' ? 'border-purple-100 bg-purple-50' :
                color === 'yellow' ? 'border-yellow-100 bg-yellow-50' :
                'border-green-100 bg-green-50'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  color === 'blue' ? 'text-blue-500' :
                  color === 'purple' ? 'text-purple-500' :
                  color === 'yellow' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{role}</p>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-green-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
        <p className="text-green-100 mb-8">Créez votre compte en quelques secondes et accédez à votre tableau de bord.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
          Créer un compte gratuit
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2026 TAXUP — Plateforme de surveillance fiscale des transactions mobiles</p>
      </footer>
    </div>
  );
}

