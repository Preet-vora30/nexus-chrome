import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetClockProps {
  visible: boolean;
  format: '12' | '24';
  className?: string;
}

/**
 * Live clock and date widget.
 */
export function WidgetClock({
  visible,
  format,
  className,
}: WidgetClockProps) {
  const [time, setTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  const timeString = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12',
  });
  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn('flex items-center gap-3 p-4', className)}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-accent-foreground">
        <Clock className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <div className="text-lg font-semibold tracking-tight">{timeString}</div>
        <div className="text-xs text-muted-foreground">{dateString}</div>
      </div>
    </div>
  );
}
