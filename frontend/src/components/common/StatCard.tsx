/**
 * =============================================================================
 * File: StatCard.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (StatCard) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  highlightColor?: 'gold' | 'navy' | 'emerald' | 'crimson';
  className?: string;
}

/**
 * StatCard component
 *
 * Executive KPI summary statistic card displaying figures and trends.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlightColor = 'gold',
  className = ''
}) => {
  const borderAccents = {
    gold: 'border-l-4 border-l-[#C5A059]',
    navy: 'border-l-4 border-l-[#1B3B6F]',
    emerald: 'border-l-4 border-l-emerald-600',
    crimson: 'border-l-4 border-l-rose-600'
  };

  const iconColors = {
    gold: 'text-[#C5A059] bg-[#C5A059]/10',
    navy: 'text-[#1B3B6F] bg-[#1B3B6F]/10',
    emerald: 'text-emerald-700 bg-emerald-100',
    crimson: 'text-rose-700 bg-rose-100'
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 ${borderAccents[highlightColor]} hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="text-2xl font-bold text-[#0D1B2A] tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[highlightColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span
            className={`font-semibold mr-1.5 ${
              trend.positive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400">vs target season quota</span>
        </div>
      )}
    </div>
  );
};
