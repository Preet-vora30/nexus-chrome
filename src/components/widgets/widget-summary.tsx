import { cn } from '@/lib/utils';
import type { TodoItem } from '@/types';

export interface WidgetSummaryProps {
  visible: boolean;
  notesCount: number;
  tasks: TodoItem[];
  focusSessionsCompleted: number;
  className?: string;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-input bg-card px-3 py-2">
      <span className="text-lg font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Daily productivity summary computed from real data:
 * - tasks completed / remaining,
 * - notes in the library,
 * - focus sessions completed.
 */
export function WidgetSummary({
  visible,
  notesCount,
  tasks,
  focusSessionsCompleted,
  className,
}: WidgetSummaryProps) {
  if (!visible) return null;

  const completed = tasks.filter((task) => task.done).length;
  const remaining = tasks.length - completed;

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Productivity
      </span>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Tasks completed" value={completed} />
        <Stat label="Tasks remaining" value={remaining} />
        <Stat label="Notes created" value={notesCount} />
        <Stat label="Focus sessions" value={focusSessionsCompleted} />
      </div>
    </div>
  );
}
