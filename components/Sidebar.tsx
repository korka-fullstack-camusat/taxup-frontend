'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  ClipboardList,
  AlertTriangle,
  Bell,
  LogOut,
  Users,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['CITOYEN', 'OPERATEUR_MOBILE', 'AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight, roles: ['CITOYEN', 'OPERATEUR_MOBILE', 'AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
  { href: '/receipts', label: 'Reçus fiscaux', icon: Receipt, roles: ['CITOYEN', 'OPERATEUR_MOBILE', 'AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
  { href: '/audits', label: 'Audits', icon: ClipboardList, roles: ['AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
  { href: '/fraud', label: 'Alertes fraude', icon: AlertTriangle, roles: ['AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['CITOYEN', 'OPERATEUR_MOBILE', 'AUDITEUR_FISCAL', 'AGENT_DGID', 'ADMIN'] },
];

const adminNavItems = [
  { href: '/admin', label: 'Administration', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyen',
  OPERATEUR_MOBILE: 'Opérateur Mobile',
  AUDITEUR_FISCAL: 'Auditeur Fiscal',
  AGENT_DGID: 'Agent DGID',
  ADMIN: 'Administrateur',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = allNavItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800 text-white flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <Image src="/taxup-logo.svg" alt="TAXUP" width={36} height={36} className="flex-shrink-0" />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">TAXUP</h1>
          <p className="text-xs text-blue-400">Surveillance fiscale</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                active
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Section Admin */}
        {isAdmin && (
          <>
            <div className="pt-5 pb-1 px-4">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Administration</p>
            </div>
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg bg-slate-900">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-blue-400 truncate">{user?.role ? roleLabel[user.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
