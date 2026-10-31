import React from 'react';

interface CurrencyDisplayProps {
  amount: number;
  format?: 'standard' | 'lakhs' | 'crores' | 'compact';
  className?: string;
  showDecimals?: boolean;
}

/**
 * CurrencyDisplay component
 *
 * Formats monetary values in INR Lakhs, Crores, or standard currency.
 */
export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  format = 'standard',
  className = '',
  showDecimals = false
}) => {
  const formatValue = (): string => {
    if (format === 'crores' || (format === 'compact' && amount >= 10000000)) {
      const cr = amount / 10000000;
      return `₹${cr.toFixed(showDecimals ? 2 : 1)} Cr`;
    }
    if (format === 'lakhs' || (format === 'compact' && amount >= 100000)) {
      const lk = amount / 100000;
      return `₹${lk.toFixed(showDecimals ? 2 : 1)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <span className={`font-mono font-semibold tracking-tight tabular-nums ${className}`}>
      {formatValue()}
    </span>
  );
};
