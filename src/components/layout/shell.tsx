import * as React from 'react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/notification';

export interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared page shell: themed background, scrolling content area, and the
 * toast anchor. Wraps children in <Toaster> so any page can use useToast().
 */
export function Shell({ children, className }: ShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300',
        className
      )}
    >
      <Toaster>{children}</Toaster>
    </div>
  );
}
