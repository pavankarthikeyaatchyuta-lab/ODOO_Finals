import React from 'react';
import { RoyalLogo } from './RoyalLogo';

export interface PageLoadingScreenProps {
  message?: string;
  submessage?: string;
}

/**
 * PageLoadingScreen component
 *
 * Full-page luxury splash loader featuring the royal crest and progress pulse.
 */
export const PageLoadingScreen: React.FC<PageLoadingScreenProps> = ({
  message = 'Initializing The Royal Knot Platform...',
  submessage = 'Synchronizing luxury wedding operations & high-security palace protocol'
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDFBF7] text-[#0D1B2A] p-4 select-none">
      {/* Background Ambient Radiance */}
      <div className="absolute w-96 h-96 rounded-full bg-radial from-[#C5A059]/15 via-[#C5A059]/5 to-transparent blur-3xl pointer-events-none animate-pulse duration-5000" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm">
        {/* Animated Brand Medallion */}
        <div className="relative">
          {/* Outer Pulsing Glow Ring */}
          <div className="absolute -inset-2.5 rounded-full bg-linear-to-tr from-[#C5A059]/40 via-transparent to-[#C5A059]/40 animate-spin duration-8000 blur-xs" />
          <RoyalLogo size="xl" />
        </div>

        {/* Loading Typography */}
        <div className="space-y-2">
          <h2 className="font-serif font-bold text-lg sm:text-xl text-[#0D1B2A] tracking-tight">
            {message}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {submessage}
          </p>
        </div>

        {/* Golden Progress Bar */}
        <div className="w-48 h-1 bg-slate-200/80 rounded-full overflow-hidden">
          <div className="w-full h-full bg-linear-to-r from-[#DFCA9B] via-[#C5A059] to-[#9D7C36] animate-pulse" />
        </div>
      </div>
    </div>
  );
};
