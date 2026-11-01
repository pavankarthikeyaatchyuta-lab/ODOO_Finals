/**
 * =============================================================================
 * File: ThemeToggle.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Interactive Light / Dark mode toggle button featuring celestial sun and moon
 * iconography, smooth rotational state transitions, and accessible ARIA attributes.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'button';
}

/**
 * ThemeToggle component
 *
 * Accessible toggle switcher for light/dark palace themes.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'button'
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Palace Mode' : 'Switch to Dark Royal Mode'}
        aria-label="Toggle theme mode"
        aria-pressed={isDark}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
          isDark
            ? 'bg-[#132238] border-[#C5A059]/40 text-[#DFCA9B] hover:bg-[#1b2d49]'
            : 'bg-white border-slate-200 text-slate-700 hover:border-[#C5A059] hover:bg-slate-50'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-[#DFCA9B] animate-spin-slow" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-[#1B3B6F]" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Palace Mode' : 'Switch to Dark Royal Mode'}
      aria-label="Toggle theme mode"
      aria-pressed={isDark}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
        isDark
          ? 'bg-[#132238] border-[#C5A059]/40 text-[#DFCA9B] hover:bg-[#1a2d4a]'
          : 'bg-white border-slate-200 text-slate-600 hover:text-[#0D1B2A] hover:bg-slate-50'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#DFCA9B] transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-[#1B3B6F] transition-transform duration-300" />
      )}
    </button>
  );
};
