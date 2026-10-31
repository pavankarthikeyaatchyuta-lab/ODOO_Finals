/**
 * =============================================================================
 * File: FormField.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (FormField) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';

/**
 * Props for the FormField wrapper component.
 */
export interface FormFieldProps {
  /** Text label displayed above the form input */
  label?: string;
  /** Whether the field is mandatory; renders a red asterisk when true */
  required?: boolean;
  /** Validation error message displayed beneath the input */
  error?: string;
  /** Subdued helper or guidance text displayed beneath the input when no error is present */
  helperText?: string;
  /** Target HTML ID of the linked input control for accessibility */
  htmlFor?: string;
  /** Optional custom container CSS classes */
  className?: string;
  /** Form control input element(s) wrapped by this field container */
  children: React.ReactNode;
}

/**
 * FormField component
 *
 * Standardized form control wrapper providing accessible label binding,
 * required indicator badges, input slotting, and contextual error/helper messages.
 *
 * @param props - Form field configuration options and children
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  htmlFor,
  className = '',
  children
}) => {
  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {/* Accessible Input Label with Optional Required Asterisk */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      {/* Primary Input Control Slot */}
      {children}

      {/* Validation Feedback: Error message takes priority over helper guidance */}
      {error ? (
        <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
