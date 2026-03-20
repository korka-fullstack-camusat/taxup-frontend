'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import api from '@/lib/api';

interface Audit {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  operator_name?: string;
}

interface FraudAlert {
  id: string;
  fraud_type: string;
  risk_score: number;
  status: string;
  detected_at: string;
}

const auditStatusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-600 bg-blue-50' },
  IN_PROGRESS: { label: 'En cours', color: 'text-yellow-600 bg-yellow-50' },
  COMPLETED: { label: 'Terminé', color: 'text-blue-600 bg-blue-50' },
  CLOSED: { label: 'Fermé', color: 'text-gray-600 bg-gray-100' },
};

const fraudTypeLabel: Record<string, string> = {
  STRUCTURING: 'Fragmentation', RAPID_TRANSFER: 'Transfert rapide',
  UNUSUAL_PATTERN: 'Schéma inhabituel', SUSPICIOUS_AMOUNT: 'Montant suspect',
  VELOCITY_ABUSE: 'Abus fréquence',
};

function riskColor(score: number) {
  if (score >= 0.8) return 'text-red-600 bg-red-50';
  if (score >= 0.5) return 'text-orange-600 bg-orange-50';
  return 'text-yellow-600 bg-yellow-50';
}

export default function DashboardAuditeur() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAudits: 0, open: 0, inProgress: 0, highRisk: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/audits?page_size=8'),
      api.get('/fraud/alerts?page_size=8'),
    ])
      .then(([auditsRes, alertsRes]) => {
        const auditItems: Audit[] = auditsRes.data.items || [];
        const alertItems: FraudAlert[] = alertsRes.data.items || [];
        setAudits(auditItems);
        setAlerts(alertItems);
        setStats({
          totalAudits: auditsRes.data.total || auditItems.length,
          open: auditItems.filter(a => a.status === 'OPEN').length,
          inProgress: auditItems.filter(a => a.status === 'IN_PROGRESS').length,
          highRisk: alertItems.filter(a => a.risk_score >= 0.7).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Tableau de bord Auditeur" subtitle="Supervision des audits et alertes fraude" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total audits" value={stats.totalAudits} icon={ClipboardList} color="blue" />
          <StatCard title="Audits ouverts" value={stats.open} icon={Clock} color="yellow" />
          <StatCard title="En cours" value={stats.inProgress} icon={TrendingUp} color="purple" />
          <StatCard title="Alertes haut risque" value={stats.highRisk} icon={AlertTriangle} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audits récents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Audits récents</h2>
              <a href="/audits" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout →</a>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : audits.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun audit</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {audits.map(audit => {
                  const s = auditStatusConfig[audit.status] || auditStatusConfig.OPEN;
                  return (
                    <div key={audit.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <ClipboardList className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{audit.title}</p>
                          <p className="text-xs text-gray-400">{new Date(audit.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alertes fraude */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Alertes fraude récentes</h2>
              <a href="/fraud" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout →</a>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{fraudTypeLabel[alert.fraud_type] || alert.fraud_type}</p>
                        <p className="text-xs text-gray-400">{new Date(alert.detected_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(alert.risk_score)}`}>
                        {Math.round(alert.risk_score * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/audits" className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-5 flex items-center gap-4 transition-colors">
            <div className="bg-blue-100 p-3 rounded-lg"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
            <div><p className="font-semibold text-gray-800">Gérer les audits</p><p className="text-sm text-gray-500">Créer et suivre les audits fiscaux</p></div>
          </a>
          <a href="/fraud" className="bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl p-5 flex items-center gap-4 transition-colors">
            <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div><p className="font-semibold text-gray-800">Alertes fraude</p><p className="text-sm text-gray-500">Analyser et traiter les alertes</p></div>
          </a>
        </div>
      </main>
    </div>
  );
}
