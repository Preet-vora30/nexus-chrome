import * as React from 'react';
import { cn } from '@/lib/utils';

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, ...props }, ref) => (
    <span
      className={cn(
        'relative inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer rounded-full',
        className
      )}
    >
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        className="sr-only peer"
        {...props}
      />
      <span
        className="pointer-events-none block rounded-full bg-border after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all after:checked:translate-x-[10px] after:checked:border-primary peer-checked:bg-primary"
      />
    </span>
  ),
);
Switch.displayName = 'Switch';
