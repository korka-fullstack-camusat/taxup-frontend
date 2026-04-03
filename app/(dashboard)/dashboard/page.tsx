'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DashboardCitoyen from '@/components/dashboards/DashboardCitoyen';
import DashboardOperateur from '@/components/dashboards/DashboardOperateur';
import DashboardAuditeur from '@/components/dashboards/DashboardAuditeur';
import DashboardDGID from '@/components/dashboards/DashboardDGID';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  // Attendre que l'auth soit prête
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  if (!user) return null;

  switch (user.role) {
    case 'CITOYEN':
      return <DashboardCitoyen />;
    case 'OPERATEUR_MOBILE':
      return <DashboardOperateur />;
    case 'AUDITEUR_FISCAL':
      return <DashboardAuditeur />;
    case 'AGENT_DGID':
      return <DashboardDGID />;
    case 'ADMIN':
      // Redirection en cours via useEffect
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
        </div>
      );
    default:
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-500 text-sm">Rôle non reconnu : <code className="bg-gray-100 px-2 py-0.5 rounded">{user.role}</code></p>
          <p className="text-gray-400 text-xs">Contactez votre administrateur.</p>
        </div>
      );
  }
}
