'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00853F]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile-only top bar with hamburger */}
        <div className="md:hidden sticky top-0 z-20 h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60 flex items-center px-4 transition-colors">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-bold text-gray-800 dark:text-white text-sm">TAXUP</span>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
