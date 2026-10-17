import * as React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-auto p-4">
        <div className="rounded-xl border border-input bg-card shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:p-6 p-4">
            {title && (
              <h2 className="flex-shrink-0 text-lg font-semibold">
                {title}
              </h2>
            )}
            <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-1">
              {children}
            </div>
            <button
              className="ml-auto rounded-md text-muted-foreground hover:text-foreground transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
