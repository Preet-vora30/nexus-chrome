import * as React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  onSettings: () => void;
  onCustomize: () => void;
  className?: string;
}

/**
 * Premium dashboard header: logo, live clock, theme switcher, settings, and
 * side-panel / tools access.
 */
export function Header({
  onSettings,
  onCustomize,
  className,
}: HeaderProps) {
  const { theme, mode, toggle } = useTheme();
  const now = React.useMemo(() => new Date(), []);
  const timeString = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between gap-4 border-b border-input bg-background px-4 py-1 sticky top-0 z-20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold tracking-tighter">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">Nexus</span>
          <span className="text-xs text-muted-foreground">Browser OS</span>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-[150px]">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{timeString}</span>
          <span className="ml-0.5">{dateString}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={`Theme: currently ${mode} (${theme})`}
        >
          {mode === 'light' ? '🌙' : mode === 'dark' ? '☀' : '🔄'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCustomize}
          aria-label="Customize"
        >
          <span className="h-4 w-4" style={{ color: 'hsl(var(--accent-blue))' }} role="img" aria-label="sparkles">✦</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
