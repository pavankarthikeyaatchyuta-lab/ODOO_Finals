import React from 'react';

export type BadgeVariant = 
  | 'success'   // Emerald
  | 'danger'    // Crimson Alert
  | 'warning'   // Amber / Gold
  | 'info'      // Royal Blue
  | 'neutral';  // Slate Gray

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  pulsing?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  pulsing = false,
  className = '',
  size = 'md'
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20',
    danger: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/30 font-bold',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/20',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-1 ring-indigo-400/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {pulsing && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === 'danger' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${variant === 'danger' ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
        </span>
      )}
      {label}
    </span>
  );
};
