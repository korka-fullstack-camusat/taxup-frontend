'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
