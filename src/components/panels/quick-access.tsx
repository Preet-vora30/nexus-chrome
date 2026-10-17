/**
 * Shared quick-access panel used by the extension popup and the side panel.
 *
 * Both entries read and write the same preferences through the shared storage
 * layer, so counts and toggles always agree across pages.
 */

import * as React from 'react';
import { FolderOpen, ListTodo, NotebookPen, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { listNotes } from '@/lib/notes';
import { listTasks } from '@/lib/todos';
import { openTab } from '@/lib/tabs';
import { browser } from '@/lib/chrome';
import { cn } from '@/lib/utils';

export interface QuickAccessProps {
  className?: string;
}

export function QuickAccess({ className }: QuickAccessProps) {
  const { theme, mode, toggle } = useTheme();
  const [notesCount, setNotesCount] = React.useState(0);
  const [tasksCount, setTasksCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([listNotes(), listTasks()]).then(([notes, tasks]) => {
      if (cancelled) return;
      setNotesCount(notes.length);
      setTasksCount(tasks.filter((task) => !task.done).length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openDashboard = async () => {
    await openTab(chrome.runtime.getURL('newtab.html'));
  };
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Nexus Browser OS</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => void toggle()}
          aria-label={`Toggle theme (currently ${mode})`}
        >
          {theme === 'light' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-lg border border-input bg-card p-3 text-left transition-colors hover:bg-accent"
          onClick={() => void openDashboard()}
        >
          <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-medium">Dashboard</span>
          <span className="text-[10px] text-muted-foreground">Open new tab</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-lg border border-input bg-card p-3 text-left transition-colors hover:bg-accent"
          onClick={() => void browser.openOptionsPage()}
        >
          <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-medium">Settings</span>
          <span className="text-[10px] text-muted-foreground">Preferences</span>
        </button>
      </div>

      <div className="rounded-lg border border-input bg-card p-3 text-xs text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
            Notes
          </span>
          <strong className="text-foreground">{notesCount}</strong>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
            Open tasks
          </span>
          <strong className="text-foreground">{tasksCount}</strong>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Open the dashboard for full tools, or use the extension icon to
        customize this popup.
      </p>
    </div>
  );
}
