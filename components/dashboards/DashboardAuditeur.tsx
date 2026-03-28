'use client';

import { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Shield,
  FileText,
  ChevronRight,
  Activity,
  Eye,
  Plus,
  RefreshCw,
  BarChart3,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface Audit {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  operator_name?: string;
  findings_count?: number;
}

interface FraudAlert {
  id: string;
  fraud_type: string;
  risk_score: number;
  status: string;
  detected_at: string;
  transaction_id?: string;
}

const auditStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  IN_PROGRESS: { label: 'En cours', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Activity },
  COMPLETED: { label: 'Termine', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  CLOSED: { label: 'Ferme', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Faible', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  MEDIUM: { label: 'Moyen', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  HIGH: { label: 'Eleve', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  CRITICAL: { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-50' },
};

const fraudTypeLabel: Record<string, string> = {
  STRUCTURING: 'Fragmentation', 
  RAPID_TRANSFER: 'Transfert rapide',
  UNUSUAL_PATTERN: 'Schema inhabituel', 
  SUSPICIOUS_AMOUNT: 'Montant suspect',
  VELOCITY_ABUSE: 'Abus frequence',
};

function riskLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 0.8) return { label: 'Critique', color: 'text-red-700', bgColor: 'bg-red-100' };
  if (score >= 0.6) return { label: 'Eleve', color: 'text-orange-600', bgColor: 'bg-orange-50' };
  if (score >= 0.4) return { label: 'Moyen', color: 'text-amber-600', bgColor: 'bg-amber-50' };
  return { label: 'Faible', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardAuditeur() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalAudits: 0, 
    open: 0, 
    inProgress: 0, 
    completed: 0,
    totalAlerts: 0,
    highRisk: 0,
    pendingAlerts: 0
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/audits?page_size=10'),
      api.get('/fraud/alerts?page_size=10'),
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
          completed: auditItems.filter(a => a.status === 'COMPLETED' || a.status === 'CLOSED').length,
          totalAlerts: alertsRes.data.total || alertItems.length,
          highRisk: alertItems.filter(a => a.risk_score >= 0.7).length,
          pendingAlerts: alertItems.filter(a => a.status === 'PENDING').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Chart data
  const auditStatusData = [
    { name: 'Ouverts', value: stats.open, color: '#3b82f6' },
    { name: 'En cours', value: stats.inProgress, color: '#f59e0b' },
    { name: 'Termines', value: stats.completed, color: '#10b981' },
  ].filter(d => d.value > 0);

  const alertsByType = Object.entries(
    alerts.reduce((acc, alert) => {
      const type = fraudTypeLabel[alert.fraud_type] || alert.fraud_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const riskDistribution = [
    { name: 'Critique', value: alerts.filter(a => a.risk_score >= 0.8).length, color: '#ef4444' },
    { name: 'Eleve', value: alerts.filter(a => a.risk_score >= 0.6 && a.risk_score < 0.8).length, color: '#f97316' },
    { name: 'Moyen', value: alerts.filter(a => a.risk_score >= 0.4 && a.risk_score < 0.6).length, color: '#f59e0b' },
    { name: 'Faible', value: alerts.filter(a => a.risk_score < 0.4).length, color: '#10b981' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord Auditeur</h1>
            <p className="text-gray-500 text-sm mt-1">Bienvenue, {user?.full_name || 'Auditeur Fiscal'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
            <a
              href="/audits"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="h-4 w-4" /> Nouvel audit
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={ClipboardList} 
            label="Total audits" 
            value={stats.totalAudits}
            subtitle={`${stats.open} ouverts`}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard 
            icon={Activity} 
            label="En cours" 
            value={stats.inProgress}
            gradient="from-amber-500 to-amber-600"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Alertes fraude" 
            value={stats.totalAlerts}
            subtitle={`${stats.highRisk} haut risque`}
            gradient="from-red-500 to-red-600"
          />
          <StatCard 
            icon={Target} 
            label="A traiter" 
            value={stats.pendingAlerts}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audit Status Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Statut des audits
            </h3>
            {auditStatusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucun audit</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie 
                      data={auditStatusData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={45} 
                      outerRadius={70} 
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {auditStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {auditStatusData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Alerts by Type */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-red-600" />
              Alertes par type
            </h3>
            {alertsByType.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune alerte</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={alertsByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Distribution des risques
            </h3>
            {riskDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donnee</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie 
                      data={riskDistribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={45} 
                      outerRadius={70} 
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {riskDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Audits */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Audits recents</h2>
              </div>
              <a href="/audits" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            {audits.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun audit</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {audits.slice(0, 6).map(audit => {
                  const s = auditStatusConfig[audit.status] || auditStatusConfig.OPEN;
                  const p = priorityConfig[audit.priority] || priorityConfig.MEDIUM;
                  const StatusIcon = s.icon;
                  return (
                    <div key={audit.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-xl ${s.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{audit.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(audit.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.bgColor} ${p.color}`}>
                          {p.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.bgColor} ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Fraud Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="font-semibold text-gray-800">Alertes fraude recentes</h2>
              </div>
              <a href="/fraud" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Voir tout <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alerts.slice(0, 6).map(alert => {
                  const risk = riskLevel(alert.risk_score);
                  return (
                    <div key={alert.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${alert.risk_score >= 0.7 ? 'bg-red-100' : 'bg-orange-100'} flex items-center justify-center`}>
                          <AlertTriangle className={`h-5 w-5 ${alert.risk_score >= 0.7 ? 'text-red-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {fraudTypeLabel[alert.fraud_type] || alert.fraud_type}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(alert.detected_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                alert.risk_score >= 0.8 ? 'bg-red-500' : 
                                alert.risk_score >= 0.6 ? 'bg-orange-500' : 
                                alert.risk_score >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${alert.risk_score * 100}%` }} 
                            />
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${risk.bgColor} ${risk.color}`}>
                            {Math.round(alert.risk_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a 
            href="/audits" 
            className="group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:border-blue-200 transition-all text-center"
          >
            <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-600 transition-colors">
              <ClipboardList className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Gerer les audits</p>
              <p className="text-xs text-gray-500 mt-0.5">Creer et suivre</p>
            </div>
          </a>
          <a 
            href="/fraud" 
            className="group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:border-red-200 transition-all text-center"
          >
            <div className="bg-red-100 p-4 rounded-xl group-hover:bg-red-600 transition-colors">
              <AlertTriangle className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Alertes fraude</p>
              <p className="text-xs text-gray-500 mt-0.5">Analyser et traiter</p>
            </div>
          </a>
          <a 
            href="/transactions" 
            className="group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:border-purple-200 transition-all text-center"
          >
            <div className="bg-purple-100 p-4 rounded-xl group-hover:bg-purple-600 transition-colors">
              <Eye className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Transactions</p>
              <p className="text-xs text-gray-500 mt-0.5">Consulter l&apos;historique</p>
            </div>
          </a>
          <a 
            href="/admin/rapports" 
            className="group bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:border-emerald-200 transition-all text-center"
          >
            <div className="bg-emerald-100 p-4 rounded-xl group-hover:bg-emerald-600 transition-colors">
              <FileText className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Rapports</p>
              <p className="text-xs text-gray-500 mt-0.5">Generer des rapports</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  gradient 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
    </div>
  );
}
