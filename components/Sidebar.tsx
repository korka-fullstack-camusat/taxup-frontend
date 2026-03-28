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
  ClipboardList,
  Plus,
  BarChart3,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Navigation items par role
const navConfig: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  CITOYEN: [
    { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { href: '/transactions', label: 'Mes Transactions', icon: ArrowLeftRight },
    { href: '/receipts', label: 'Mes Reçus Fiscaux', icon: Receipt },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  OPERATEUR_MOBILE: [
    { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/receipts', label: 'Reçus Fiscaux', icon: Receipt },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
  AUDITEUR_FISCAL: [
    { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { href: '/audits', label: 'Gestion Audits', icon: ClipboardList },
    { href: '/fraud', label: 'Alertes Fraude', icon: Shield },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/receipts', label: 'Reçus Fiscaux', icon: Receipt },
    { href: '/admin/rapports', label: 'Rapports', icon: FileText },
  ],
  AGENT_DGID: [
    { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/fraud', label: 'Detection Fraude', icon: Shield },
    { href: '/audits', label: 'Audits', icon: ClipboardList },
    { href: '/receipts', label: 'Reçus Fiscaux', icon: Receipt },
    { href: '/admin/revenus', label: 'Analyse Revenus', icon: TrendingUp },
    { href: '/admin/operateurs', label: 'Operateurs', icon: Building2 },
    { href: '/admin/carte-fiscale', label: 'Carte Fiscale', icon: Map },
    { href: '/admin/rapports', label: 'Rapports', icon: FileText },
  ],
  ADMIN: [
    { href: '/admin', label: 'Tableau de Bord', icon: BarChart3 },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/fraud', label: 'Detection Fraude', icon: Shield },
    { href: '/audits', label: 'Audits', icon: ClipboardList },
    { href: '/receipts', label: 'Reçus Fiscaux', icon: Receipt },
    { href: '/admin/revenus', label: 'Analyse Revenus', icon: TrendingUp },
    { href: '/admin/operateurs', label: 'Operateurs', icon: Building2 },
    { href: '/admin/carte-fiscale', label: 'Carte Fiscale', icon: Map },
    { href: '/admin/acces', label: 'Gestion Acces', icon: Users },
    { href: '/admin/rapports', label: 'Rapports', icon: FileText },
    { href: '/admin/parametres', label: 'Parametres', icon: Settings },
  ],
};

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

  // Get navigation items based on user role
  const navItems = user?.role ? (navConfig[user.role] || navConfig.CITOYEN) : navConfig.CITOYEN;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col z-20 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-white">T</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">TAXUP</h1>
          <p className="text-xs text-blue-400">Systeme Fiscal Digital</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isAdminDash = href === '/admin';
          const isDash = href === '/dashboard';
          const active = pathname === href || 
            (isAdminDash && pathname.startsWith('/admin')) ||
            (!isAdminDash && !isDash && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                active
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-blue-400 truncate">{user?.role ? roleLabel[user.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          Deconnexion
        </button>
        <p className="text-center text-[10px] text-slate-600 pt-1">Version 2.1.0</p>
      </div>
    </aside>
  );
}
