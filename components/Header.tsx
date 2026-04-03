'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => setCurrentTime(
      new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Taxup - Tableau de Bord Fiscal</h1>
        <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">En ligne</span>
        <span className="text-sm text-gray-400 dark:text-slate-500">Dernière mise à jour: {currentTime}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
        <ThemeToggle />
        <button className="relative p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-slate-700 pl-3">
          <div className="h-9 w-9 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{user?.full_name || 'Utilisateur'}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
