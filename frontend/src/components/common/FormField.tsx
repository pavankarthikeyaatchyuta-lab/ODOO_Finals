import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

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
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
