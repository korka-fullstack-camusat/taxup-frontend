import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  trend?: { value: number; label: string };
}

const colorMap = {
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', border: 'border-green-100 dark:border-green-800/30' },
  blue: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700', border: 'border-green-100 dark:border-green-800/30' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', border: 'border-red-100 dark:border-red-800/30' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', border: 'border-yellow-100 dark:border-yellow-800/30' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', border: 'border-purple-100 dark:border-purple-800/30' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${c.border} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.value >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'
          }`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
