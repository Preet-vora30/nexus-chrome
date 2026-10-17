import * as React from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center p-6',
        className
      )}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
