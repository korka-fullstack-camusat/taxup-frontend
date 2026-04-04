'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  variant?: 'default' | 'nav';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const cls = variant === 'nav'
    ? 'p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors'
    : 'p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors';

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      className={cls}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
