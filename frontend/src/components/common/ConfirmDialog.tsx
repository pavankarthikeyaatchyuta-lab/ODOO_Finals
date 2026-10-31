import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'gold' | 'danger';
  loading?: boolean;
}

/**
 * ConfirmDialog component
 *
 * Confirmation modal dialog for destructive or critical workflow actions.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'gold',
  loading = false
}) => {
  const iconConfig = {
    primary: <HelpCircle className="w-8 h-8 text-[#1B3B6F]" />,
    gold: <AlertCircle className="w-8 h-8 text-[#C5A059]" />,
    danger: <ShieldAlert className="w-8 h-8 text-rose-600" />
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
          {iconConfig[variant]}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pt-1">
          {description}
        </p>
      </div>
    </Modal>
  );
};
