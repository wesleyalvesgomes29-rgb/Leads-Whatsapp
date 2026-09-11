import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'indigo' | 'amber' | 'blue';
  tag?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  tag,
}) => {
  const variantStyles = {
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-100/70 text-emerald-800',
      highlight: 'text-emerald-700',
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badge: 'bg-indigo-100/70 text-indigo-800',
      highlight: 'text-indigo-700',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: 'bg-amber-100/70 text-amber-800',
      highlight: 'text-amber-700',
    },
    blue: {
      bgIcon: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'bg-blue-100/70 text-blue-800',
      highlight: 'text-blue-700',
    },
  }[variant];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative transition hover:border-slate-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${variantStyles.bgIcon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {tag && (
          <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${variantStyles.badge}`}>
            {tag}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-slate-500 mt-2.5 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};
