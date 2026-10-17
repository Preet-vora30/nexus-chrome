import * as React from 'react';
import { Bell, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FocusSettings } from '@/types';

export interface WidgetFocusProps {
  visible: boolean;
  settings: FocusSettings;
  sessionsCompleted: number;
  onToggleNotifications: (enabled: boolean) => void;
  onSessionCompleted: () => void;
  className?: string;
}

/**
 * Pomodoro-style focus timer.
 *
 * Timing is deadline based: `endAt` is recorded when a run starts, and the
 * remaining time is derived from the wall clock. This keeps the timer
 * correct even when the extension page is throttled or hidden (Chrome limits
 * timers in background tabs), and it never double counts a session.
 */
export function WidgetFocus({
  visible,
  settings,
  sessionsCompleted,
  onToggleNotifications,
  onSessionCompleted,
  className,
}: WidgetFocusProps) {
  const totalSeconds = React.useMemo(() => {
    const focus = Math.max(0, settings.focusMinutes) * 60;
    const rest = Math.max(0, settings.breakMinutes) * 60;
    return focus + rest;
  }, [settings.focusMinutes, settings.breakMinutes]);

  const [remaining, setRemaining] = React.useState(totalSeconds);
  const [running, setRunning] = React.useState(false);
  const endAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        endAtRef.current = null;
        setRemaining(totalSeconds);
        void onSessionCompleted();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    const handleVisibility = () => {
      // Background throttling can delay ticks; recompute on return.
      tick();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [running, totalSeconds, onSessionCompleted]);

  React.useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(false);
    endAtRef.current = null;
  }, [totalSeconds]);

  if (!visible) return null;

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const pause = () => {
    setRunning(false);
    const endAt = endAtRef.current;
    if (endAt !== null) {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      endAtRef.current = null;
    }
  };
  const resume = () => {
    if (running) return;
    if (remaining <= 0) return;
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    endAtRef.current = null;
    setRemaining(totalSeconds);
  };

  return (
    <div className={cn('flex flex-col items-center gap-3 p-4', className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Focus timer
      </span>
      <div
        className="flex items-center gap-1 text-2xl font-mono font-bold text-foreground"
        aria-live="polite"
      >
        {timeString}
      </div>
      <p className="text-xs text-muted-foreground">
        {settings.focusMinutes} min focus · {settings.breakMinutes} min break
      </p>
      <div className="flex items-center gap-2">
        {!running ? (
          <Button
            size="sm"
            variant="outline"
            onClick={resume}
            disabled={remaining <= 0}
            aria-label="Start focus timer"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={pause}
            aria-label="Pause focus timer"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset} aria-label="Reset timer">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={settings.notificationsEnabled}
          onChange={(event) =>
            onToggleNotifications(event.target.checked)
          }
          aria-label="Enable completion notifications"
        />
        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Notify when a focus session ends</span>
      </label>
      <p className="text-xs text-muted-foreground">
        {sessionsCompleted} focus session
        {sessionsCompleted === 1 ? '' : 's'} completed
      </p>
    </div>
  );
}
