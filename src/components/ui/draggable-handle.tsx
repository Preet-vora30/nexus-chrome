import * as React from 'react';
import { cn } from '@/lib/utils';

export type DraggableHandleProps = React.HTMLAttributes<HTMLDivElement>;

export function DraggableHandle({ className }: DraggableHandleProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 cursor-grab active:cursor-grabbing text-muted-foreground',
        className
      )}
      aria-hidden="true"
    >
    </div>
  );
}
