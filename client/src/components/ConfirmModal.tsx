import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-panel border border-border rounded-lg shadow-2xl overflow-hidden glow-accent-strong">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-mono font-bold text-off-white mb-2">{title}</h3>
              <p className="text-sm text-off-white-muted leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-card border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-mono font-medium rounded border border-border hover:bg-panel transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-mono font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;
