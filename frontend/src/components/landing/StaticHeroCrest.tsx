/**
 * =============================================================================
 * File: StaticHeroCrest.tsx
 * Module: Public Showcase & 3D Interactive Component
 * =============================================================================
 * High-impact landing page visual component (StaticHeroCrest) delivering royal aesthetic storytelling, palace galleries, or 3D graphics.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export interface StaticHeroCrestProps {
  className?: string;
}

/**
 * StaticHeroCrest component
 *
 * Crisp static 2D fallback crest rendered when WebGL is unavailable or reduced-motion is requested.
 */
export const StaticHeroCrest: React.FC<StaticHeroCrestProps> = ({ className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Outer Ambient Radiance */}
      <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-radial from-[#C5A059]/25 via-[#C5A059]/5 to-transparent blur-2xl pointer-events-none -z-10 animate-pulse duration-10000" />

      {/* Decorative Outer Concentric Filigree Ring */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[#C5A059]/30 border-dashed pointer-events-none"
      />

      {/* Secondary Counter-Rotating Architectural Ring */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        className="absolute w-56 h-56 sm:w-68 sm:h-68 rounded-full border border-[#C5A059]/20 pointer-events-none flex items-center justify-between p-2"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]/60" />
      </motion.div>

      {/* Primary Circular Seal Medallion with Official Logo */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#DFCA9B] to-[#9D7C36] shadow-2xl shadow-[#0D1B2A]/40 flex items-center justify-center overflow-hidden"
      >
        {/* Specular Diagonal Sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#DFCA9B]/20 to-transparent pointer-events-none z-10" />

        {/* Central Luxury Logo Emblem */}
        <div className="w-full h-full rounded-full overflow-hidden bg-[#0D1B2A] flex items-center justify-center p-0.5 relative">
          <img
            src="/royal-knot-logo.png"
            alt="The Royal Knot Official Crest"
            className="w-full h-full object-contain rounded-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
            loading="eager"
          />
          <Sparkles className="w-5 h-5 text-[#DFCA9B] absolute top-3 right-5 animate-ping duration-3000 pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};
