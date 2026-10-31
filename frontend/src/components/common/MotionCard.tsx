import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverY?: number;
  interactive?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  hoverScale = 1.01,
  hoverY = -2,
  interactive = true,
  onClick,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !interactive) {
    return (
      <div
        className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-shadow duration-200 ${
          interactive ? 'hover:shadow-md cursor-pointer' : ''
        } ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        y: hoverY,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-shadow duration-200 ${
        interactive ? 'hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};
