'use client';

import { useAuth } from '@/lib/auth';
import DashboardCitoyen from '@/components/dashboards/DashboardCitoyen';
import DashboardOperateur from '@/components/dashboards/DashboardOperateur';
import DashboardAuditeur from '@/components/dashboards/DashboardAuditeur';
import DashboardDGID from '@/components/dashboards/DashboardDGID';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'CITOYEN':
      return <DashboardCitoyen />;
    case 'OPERATEUR_MOBILE':
      return <DashboardOperateur />;
    case 'AUDITEUR_FISCAL':
      return <DashboardAuditeur />;
    case 'AGENT_DGID':
    case 'ADMIN':
      return <DashboardDGID />;
    default:
      return null;
  }
}
