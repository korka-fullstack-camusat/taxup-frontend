'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BarChart2, Shield, FileCheck, Bell, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const features = [
  { icon: BarChart2, title: 'Surveillance temps réel',   color: 'text-blue-500',   bg: 'bg-blue-50'   },
  { icon: Shield,    title: 'Détection de fraude',       color: 'text-red-500',    bg: 'bg-red-50'    },
  { icon: FileCheck, title: 'Reçus fiscaux certifiés',   color: 'text-emerald-500',bg: 'bg-emerald-50'},
  { icon: Bell,      title: 'Alertes instantanées',      color: 'text-amber-500',  bg: 'bg-amber-50'  },
  { icon: Lock,      title: 'Accès sécurisé par rôle',   color: 'text-purple-500', bg: 'bg-purple-50' },
];

const roles = [
  { label: 'Citoyen',          bg: 'bg-blue-100',   text: 'text-blue-700'   },
  { label: 'Opérateur Mobile', bg: 'bg-purple-100', text: 'text-purple-700' },
  { label: 'Auditeur Fiscal',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { label: 'Agent DGID',       bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { label: 'Administrateur',   bg: 'bg-slate-100',  text: 'text-slate-700'  },
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

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/taxup-logo.svg" alt="TAXUP" width={30} height={30} />
            <span className="font-bold text-gray-900 text-lg tracking-wide">TAXUP</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Se connecter <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center gap-6">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
            Plateforme Nationale d&apos;Audit Digital Fiscal
          </span>

          {/* Logo central */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 my-2">
            <Image src="/taxup-logo.svg" alt="TAXUP" width={64} height={64} />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-3xl">
            Audit fiscal des<br />
            <span className="text-blue-300">transactions Mobile Money</span>
          </h1>

          <p className="text-base text-slate-300 max-w-xl">
            Détection de fraude, conformité fiscale et supervision en temps réel — dans une seule plateforme sécurisée.
          </p>

          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-lg text-sm sm:text-base"
          >
            Accéder à la plateforme <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-10">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.map(({ icon: Icon, title, color, bg }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 leading-snug">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
            Conçu pour chaque profil
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {roles.map(({ label, bg, text }) => (
              <span
                key={label}
                className={`${bg} ${text} text-xs sm:text-sm font-semibold px-4 py-2 rounded-full`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ───────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Prêt à commencer ?
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow text-sm sm:text-base"
          >
            Accéder à mon espace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-500 py-6 text-center text-xs px-4">
        © {new Date().getFullYear()} TAXUP — Tous droits réservés
      </footer>

    </div>
  );
}
