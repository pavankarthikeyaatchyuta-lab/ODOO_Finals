/**
 * =============================================================================
 * File: Button.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (Button) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button component
 *
 * Reusable styled button supporting primary, secondary, outline, and ghost variants.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#1B3B6F] hover:bg-[#0D1B2A] text-white shadow-xs focus:ring-[#1B3B6F] border border-transparent',
    gold: 'bg-gradient-to-r from-[#DFCA9B] to-[#C5A059] hover:from-[#C5A059] hover:to-[#9D7C36] text-[#0D1B2A] font-bold shadow-xs focus:ring-[#C5A059] border border-[#C5A059]/40',
    secondary: 'bg-white dark:bg-[#132238] hover:bg-slate-50 dark:hover:bg-[#1B2F4C] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#243B5C] shadow-2xs focus:ring-slate-300',
    outline: 'bg-transparent hover:bg-slate-50 dark:hover:bg-[#132238] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#243B5C] shadow-2xs focus:ring-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-[#132238] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent'
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs font-semibold px-4 py-2 gap-2',
    lg: 'text-sm font-semibold px-5 py-2.5 gap-2.5'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>

      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
