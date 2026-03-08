'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DashboardCitoyen from '@/components/dashboards/DashboardCitoyen';
import DashboardOperateur from '@/components/dashboards/DashboardOperateur';
import DashboardAuditeur from '@/components/dashboards/DashboardAuditeur';
import DashboardDGID from '@/components/dashboards/DashboardDGID';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [user, router]);

  switch (user?.role) {
    case 'CITOYEN':
      return <DashboardCitoyen />;
    case 'OPERATEUR_MOBILE':
      return <DashboardOperateur />;
    case 'AUDITEUR_FISCAL':
      return <DashboardAuditeur />;
    case 'AGENT_DGID':
      return <DashboardDGID />;
    default:
      return null;
  }
}
