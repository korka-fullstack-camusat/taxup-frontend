'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Shield,
  Receipt,
  TrendingUp,
  Building2,
  Map,
  Users,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/transactions', label: 'Suivi Transactions', icon: ArrowLeftRight },
  { href: '/fraud', label: 'D\u00e9tection Fraude', icon: Shield },
  { href: '/receipts', label: 'V\u00e9rification Re\u00e7us', icon: Receipt },
  { href: '/admin/revenus', label: 'Analyse Revenus', icon: TrendingUp },
  { href: '/admin/operateurs', label: 'Op\u00e9rateurs', icon: Building2 },
  { href: '/admin/carte-fiscale', label: 'Carte Fiscale', icon: Map },
  { href: '/admin/acces', label: 'Gestion Acc\u00e8s', icon: Users },
  { href: '/admin/rapports', label: 'Rapports', icon: FileText },
  { href: '/admin/parametres', label: 'Param\u00e8tres', icon: Settings },
];

const roleLabel: Record<string, string> = {
  CITOYEN: 'Citoyen',
  OPERATEUR_MOBILE: 'Op\u00e9rateur Mobile',
  AUDITEUR_FISCAL: 'Auditeur Fiscal',
  AGENT_DGID: 'Agent DGID',
  ADMIN: 'Administrateur',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Image src="/taxup-logo.svg" alt="TAXUP" width={24} height={24} className="brightness-0 invert" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-gray-900">TAXUP</h1>
          <p className="text-xs text-gray-400">Syst\u00e8me Fiscal Digital</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                active
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border-r-3 border-emerald-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      <div className="px-5 py-2 text-xs text-gray-300">
        Version 2.1.0
      </div>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role ? roleLabel[user.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          D\u00e9connexion
        </button>
      </div>
    </aside>
  );
}
