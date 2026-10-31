import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Module-level state for safe nested modal management
let activeModalCount = 0;
let originalOverflow = '';
const modalStack: string[] = [];

function lockBodyScroll() {
  if (activeModalCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeModalCount++;
}

function unlockBodyScroll() {
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md'
}) => {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Track active modal in stack
    modalStack.push(modalId);
    lockBodyScroll();

    // Preserve previously focused element for accessible restoration on close
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Helper: find visible, enabled focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      if (!dialogRef.current) return [];
      const candidateElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );

      return candidateElements.filter(el => {
        // Exclude disabled controls
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
          return false;
        }
        // Exclude hidden elements
        if (
          el.hasAttribute('hidden') ||
          el.getAttribute('aria-hidden') === 'true' ||
          el.offsetParent === null
        ) {
          return false;
        }
        return true;
      });
    };

    // Auto-focus the first interactive element or dialog card
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0]?.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Topmost modal isolation: only the topmost modal responds
      const isTopmost = modalStack[modalStack.length - 1] === modalId;
      if (!isTopmost) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl || !dialogRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl || !dialogRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);

      // Remove from stack
      const index = modalStack.indexOf(modalId);
      if (index !== -1) {
        modalStack.splice(index, 1);
      }
      unlockBodyScroll();

      // Restore focus to opener element
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, modalId, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descId : undefined}
        tabIndex={-1}
        className={`bg-white w-full ${maxWidthStyles[maxWidth]} rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] focus:outline-none`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <h3 id={titleId} className="font-serif font-bold text-base text-[#0D1B2A] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p id={descId} className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {children}
        </div>

        {/* Optional Action Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
