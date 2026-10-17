import * as React from 'react';
import { Check, CheckCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TaskDraft, TaskFilter } from '@/lib/todos';
import type { TodoItem } from '@/types';

export interface WidgetTodosProps {
  visible: boolean;
  tasks: TodoItem[];
  onCreate: (draft: TaskDraft) => Promise<void>;
  onComplete: (id: string, done: boolean) => Promise<void>;
  onUpdate: (
    id: string,
    patch: { priority?: TodoItem['priority']; dueDate?: string; category?: string }
  ) => void;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

function formatDue(dueDate: string): string {
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * To-do widget: add, edit, complete, reopen, and delete persisted tasks with
 * priorities, due dates, categories, filters, and progress.
 */
export function WidgetTodos({
  visible,
  tasks,
  onCreate,
  onComplete,
  onUpdate,
  onDelete,
  className,
}: WidgetTodosProps) {
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<'none' | 'low' | 'medium' | 'high'>(
    'none'
  );
  const [dueDate, setDueDate] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [filter, setFilter] = React.useState<TaskFilter>('all');
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const visibleTasks = React.useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.done);
    if (filter === 'completed') return tasks.filter((task) => task.done);
    return tasks;
  }, [tasks, filter]);

  if (!visible) return null;

  const completedCount = tasks.filter((task) => task.done).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const beginEdit = (task: TodoItem) => {
    setEditingId(task.id);
    setTitle(task.title);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setCategory(task.category ?? '');
  };
  const cancelEdit = () => setEditingId(null);

  const submitDraft = () => {
    const text = title.trim();
    if (!text) return;
    void onCreate({
      title: text,
      priority,
      dueDate: dueDate || undefined,
      category: category.trim() || undefined,
    });
    setTitle('');
    setDueDate('');
    setCategory('');
    setEditingId(null);
  };

  const submitEdit = () => {
    if (!editingId) return;
    const text = title.trim();
    if (!text) return;
    onUpdate(editingId, {
      priority,
      dueDate: dueDate || undefined,
      category: category.trim() || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          To-do
        </span>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{tasks.length} done
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion progress"
        />
      </div>

      <div className="flex gap-1">
        {(['all', 'active', 'completed'] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={filter === option ? 'default' : 'ghost'}
            className="capitalize"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task…"
          aria-label="New task"
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitDraft();
          }}
        />
        <Button size="sm" onClick={submitDraft} disabled={!title.trim()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {editingId && (
        <div className="flex flex-col gap-2 rounded-lg border border-input p-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1 text-muted-foreground">
              Priority
              <select
                className="rounded-md border border-input bg-transparent px-2 py-1 text-foreground"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as 'none' | 'low' | 'medium' | 'high'
                  )
                }
                aria-label="Task priority"
              >
                {Object.keys(PRIORITY_LABELS).map((level) => (
                  <option key={level} value={level}>
                    {PRIORITY_LABELS[level]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-muted-foreground">
              Due
              <input
                type="date"
                className="rounded-md border border-input bg-transparent px-2 py-1 text-foreground"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                aria-label="Task due date"
              />
            </label>
            <label className="flex items-center gap-1 text-muted-foreground">
              Category
              <input
                className="w-24 rounded-md border border-input bg-transparent px-2 py-1 text-foreground"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Work"
                aria-label="Task category"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitEdit}>
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {visibleTasks.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs italic text-muted-foreground">
            {tasks.length === 0
              ? 'No tasks yet. Add your first task!'
              : filter === 'active'
                ? 'No active tasks.'
                : 'No completed tasks.'}
          </p>
        ) : (
          visibleTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border border-input bg-card p-2"
            >
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full border border-input p-1 transition-colors hover:bg-accent"
                onClick={() => void onComplete(task.id, !task.done)}
                aria-pressed={task.done}
                aria-label={task.done ? 'Reopen task' : 'Complete task'}
              >
                {task.done ? (
                  <CheckCheck className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </Button>
              <span
                className={cn(
                  'flex-1 truncate text-sm',
                  task.done ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {task.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {task.priority !== 'none' && `${PRIORITY_LABELS[task.priority]} · `}
                {task.dueDate ? `Due ${formatDue(task.dueDate)}` : ''}
                {task.category ? ` · ${task.category}` : ''}
              </span>
              {editingId === task.id ? null : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => beginEdit(task)}
                  aria-label={`Edit task ${task.title}`}
                >
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="p-1 text-destructive hover:text-destructive/90"
                onClick={() => void onDelete(task.id)}
                aria-label={`Delete task ${task.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
