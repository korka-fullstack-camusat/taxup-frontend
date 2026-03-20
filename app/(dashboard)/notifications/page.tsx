'use client';

import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, ArrowLeftRight } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TRANSACTION_ALERT: { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' },
  FRAUD_ALERT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  AUDIT_UPDATE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  SYSTEM: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100' },
  TAX_REMINDER: { icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const pageSize = 20;

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (unreadOnly) params.append('unread_only', 'true');
    api.get(`/notifications?${params}`)
      .then(res => { setNotifications(res.data.items || []); setTotal(res.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, unreadOnly]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'} />
      <main className="flex-1 p-6 space-y-4">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }}
              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
            <span className="text-sm text-gray-700">Non lues uniquement</span>
          </label>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-green-600 hover:text-green-700 font-medium">
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => {
                  const t = typeConfig[notif.notification_type] || typeConfig.SYSTEM;
                  const Icon = t.icon;
                  return (
                    <div key={notif.id}
                      className={`px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-green-50/30' : ''}`}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.bg}`}>
                        <Icon className={`h-5 w-5 ${t.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-800 ${!notif.is_read ? 'font-semibold' : ''}`}>{notif.title}</p>
                          {!notif.is_read && (
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Page {page} · {total} résultats</p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Précédent</button>
                  <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
