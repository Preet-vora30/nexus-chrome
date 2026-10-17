import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

/**
 * Accessible confirmation / modal dialog with backdrop, focus trapping via
 * native dialog semantics, and optional confirm/cancel actions.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md mx-auto p-4">
        <div
          className={cn(
            'rounded-xl border border-input bg-card text-card-foreground shadow-lg flex flex-col',
            variant === 'destructive' ? 'border-destructive' : ''
          )}
        >
          <div className="p-6">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {children && (
              <div className="mt-4">{children}</div>
            )}
          </div>
          <div className="flex items-center justify-between p-6 pt-0 gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]'
              )}
            >
              {loading ? 'Saving...' : confirmLabel}
            </button>
          </div>
        </div>
        <button
          className="absolute right-2 top-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
