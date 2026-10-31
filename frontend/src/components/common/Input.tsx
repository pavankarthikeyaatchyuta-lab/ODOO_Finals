/**
 * =============================================================================
 * File: Input.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (Input) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
  suffixText?: string;
}

/**
 * Input component
 *
 * Standardized form text/number input with validation styling.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  error = false,
  leftIcon,
  rightIcon,
  prefixText,
  suffixText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          {leftIcon}
        </span>
      )}

      {prefixText && (
        <span className="absolute left-3 font-mono font-medium text-xs text-slate-400 pointer-events-none">
          {prefixText}
        </span>
      )}

      <input
        ref={ref}
        disabled={disabled}
        className={`w-full text-xs font-medium text-slate-900 bg-white border rounded-xl py-2 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:ring-rose-400 text-rose-900'
            : 'border-slate-200 hover:border-slate-300'
        } ${leftIcon || prefixText ? (prefixText ? 'pl-8' : 'pl-9') : 'pl-3.5'} ${
          rightIcon || suffixText ? (suffixText ? 'pr-8' : 'pr-9') : 'pr-3.5'
        } ${className}`}
        {...props}
      />

      {suffixText && (
        <span className="absolute right-3 font-mono font-medium text-xs text-slate-400 pointer-events-none">
          {suffixText}
        </span>
      )}

      {rightIcon && (
        <span className="absolute right-3 text-slate-400 flex items-center">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
