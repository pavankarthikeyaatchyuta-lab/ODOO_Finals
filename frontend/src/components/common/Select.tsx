import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  error = false,
  placeholder,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        disabled={disabled}
        className={`w-full appearance-none text-xs font-medium text-slate-900 bg-white border rounded-xl py-2 pl-3.5 pr-8 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-rose-400 focus:ring-rose-400 text-rose-900'
            : 'border-slate-200 hover:border-slate-300'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
});

Select.displayName = 'Select';
