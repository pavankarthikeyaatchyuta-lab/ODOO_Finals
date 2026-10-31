/**
 * =============================================================================
 * File: RoyalLogo.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (RoyalLogo) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';

export interface RoyalLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  subtext?: string;
}

/**
 * RoyalLogo component
 *
 * Official The Royal Knot brand crest emblem with luxury golden circular styling.
 */
export const RoyalLogo: React.FC<RoyalLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtext
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} shrink-0 rounded-full p-0.5 bg-radial from-[#C5A059]/30 to-transparent shadow-md`}>
        <img
          src="/royal-knot-logo.png"
          alt="The Royal Knot Crest"
          className="w-full h-full object-contain rounded-full drop-shadow-[0_2px_8px_rgba(197,160,89,0.35)]"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <span className="font-serif font-bold text-base tracking-wider text-[#0D1B2A] block">
            THE ROYAL KNOT
          </span>
          {subtext && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] block mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
