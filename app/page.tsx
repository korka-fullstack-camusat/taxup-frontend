'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-8 max-w-sm w-full">

        {/* Logo */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
          <Image src="/taxup-logo.svg" alt="TAXUP" width={56} height={56} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">TAXUP</h1>
          <p className="text-slate-400 text-sm">
            Audit digital des transactions Mobile Money
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-900/40"
        >
          Accéder à la plateforme
        </Link>

        {/* Roles */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Citoyen', 'Opérateur', 'Auditeur', 'Agent DGID', 'Admin'].map((r) => (
            <span key={r} className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {r}
            </span>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} TAXUP</p>
      </div>
    </main>
  );
}
