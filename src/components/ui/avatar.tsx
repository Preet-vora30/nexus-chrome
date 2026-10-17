import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Renders a favicon/image when available, otherwise a colored circle with the
 * first letter(s) of the label as a fallback initial.
 */
export function Avatar({ src, label, size = 'md', className }: AvatarProps) {
  const sizeMap = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-[11px]',
    lg: 'h-10 w-10 text-[12px]',
  };

  const initials = label
    ? label
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const hue = Math.abs(
    label
      ? label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0
  ) % 360;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full overflow-hidden border border-input text-accent-foreground font-semibold select-none shrink-0',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: `hsl(${hue}, 60%, 18%)` }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      ) : (
        initials
      )}
    </div>
  );
}
