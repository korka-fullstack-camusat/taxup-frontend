'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeftRight, ShieldAlert, ClipboardList, Settings, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface AdminStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_transactions: number;
  total_fraud_alerts: number;
  total_audits: number;
  users_by_role: Record<string, number>;
}

const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyens',
  OPERATEUR_MOBILE: 'Opérateurs',
  AUDITEUR_FISCAL: 'Auditeurs',
  AGENT_DGID: 'Agents DGID',
  ADMIN: 'Admins',
};

const roleColor: Record<string, string> = {
  CITOYEN: 'bg-blue-100 text-blue-700',
  OPERATEUR_MOBILE: 'bg-purple-100 text-purple-700',
  AUDITEUR_FISCAL: 'bg-yellow-100 text-yellow-700',
  AGENT_DGID: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [usersRes, txRes, fraudRes, auditsRes] = await Promise.allSettled([
        api.get('/users?page_size=1000'),
        api.get('/transactions?page_size=1'),
        api.get('/fraud/alerts?page_size=1'),
        api.get('/audits?page_size=1'),
      ]);

      let users: { role: string; is_active: boolean }[] = [];
      if (usersRes.status === 'fulfilled') {
        users = usersRes.value.data.items || usersRes.value.data || [];
      }

      const activeUsers = users.filter((u) => u.is_active).length;
      const inactiveUsers = users.filter((u) => !u.is_active).length;
      const byRole = users.reduce((acc: Record<string, number>, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total_users: users.length,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        total_transactions: txRes.status === 'fulfilled' ? (txRes.value.data.total || 0) : 0,
        total_fraud_alerts: fraudRes.status === 'fulfilled' ? (fraudRes.value.data.total || 0) : 0,
        total_audits: auditsRes.status === 'fulfilled' ? (auditsRes.value.data.total || 0) : 0,
        users_by_role: byRole,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de la plateforme TAXUP</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Utilisateurs total" value={stats?.total_users ?? 0} color="blue" />
            <StatCard icon={UserCheck} label="Utilisateurs actifs" value={stats?.active_users ?? 0} color="green" />
            <StatCard icon={UserX} label="Utilisateurs inactifs" value={stats?.inactive_users ?? 0} color="red" />
            <StatCard icon={ArrowLeftRight} label="Transactions" value={stats?.total_transactions ?? 0} color="purple" />
            <StatCard icon={ShieldAlert} label="Alertes fraude" value={stats?.total_fraud_alerts ?? 0} color="orange" />
            <StatCard icon={ClipboardList} label="Audits" value={stats?.total_audits ?? 0} color="yellow" />
          </div>

          {/* Répartition par rôle */}
          {stats && Object.keys(stats.users_by_role).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Répartition des utilisateurs par rôle
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.users_by_role).map(([role, count]) => (
                  <div key={role} className={`px-4 py-2 rounded-full text-sm font-medium ${roleColor[role] || 'bg-gray-100 text-gray-700'}`}>
                    {roleLabel[role] || role}: <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          href="/admin/users"
          icon={Users}
          title="Gestion des utilisateurs"
          desc="Créer, modifier, désactiver des comptes utilisateurs"
          color="blue"
        />
        <QuickAction
          href="/transactions"
          icon={ArrowLeftRight}
          title="Toutes les transactions"
          desc="Consulter et filtrer l'ensemble des transactions"
          color="purple"
        />
        <QuickAction
          href="/fraud"
          icon={ShieldAlert}
          title="Alertes fraude"
          desc="Gérer toutes les alertes de fraude détectées"
          color="red"
        />
        <QuickAction
          href="/audits"
          icon={ClipboardList}
          title="Audits"
          desc="Suivre et gérer tous les audits fiscaux"
          color="yellow"
        />
        <QuickAction
          href="/admin/settings"
          icon={Settings}
          title="Paramètres"
          desc="Configurer les paramètres de la plateforme"
          color="gray"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, desc, color }: { href: string; icon: React.ElementType; title: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100',
    gray: 'bg-gray-50 text-gray-600 group-hover:bg-gray-100',
  };
  return (
    <Link href={href} className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex items-start gap-4">
      <div className={`p-3 rounded-xl transition-colors ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
    </Link>
  );
}
