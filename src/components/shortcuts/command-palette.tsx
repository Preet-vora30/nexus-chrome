/**
 * Command palette.
 *
 * Lets the user run dashboard actions with the keyboard. Results are the
 * matching commands plus open-tab suggestions when the typed query matches
 * an open tab (so switching to a tab is always a real action).
 */

import * as React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  buildTabSuggestions,
  COMMANDS,
  type Command,
} from '@/lib/commands';
export interface CommandPaletteApi {
  /** Text typed into the command palette. */
  query: string;
  openTab: (url: string) => Promise<void>;
  /** Focus an existing tab. */
  switchToTab: (tabId: number) => Promise<void>;
  openChromePage: (url: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  createNote: () => Promise<void>;
  createTask: () => Promise<void>;
  resetDashboardLayout: () => Promise<void>;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => Promise<void> | void;
  onRun: (run: (api: CommandPaletteApi) => Promise<void>) => Promise<void>;
  className?: string;
}

interface PaletteEntry {
  id: string;
  label: string;
  description: string;
  run: (api: CommandPaletteApi) => Promise<void>;
}

function commandEntry(command: Command): PaletteEntry {
  return {
    id: command.id,
    label: command.label,
    description: command.description,
    run: (context) => command.run(context),
  };
}

function buildEntries(query: string): Promise<PaletteEntry[]> {
  const q = query.trim().toLowerCase();
  const commands = COMMANDS.filter((command) => {
    const haystack = `${command.label} ${command.keywords.join(' ')}`.toLowerCase();
    return q.length === 0 || haystack.includes(q);
  }).map((command) => commandEntry(command));

  return buildTabSuggestions(query).then((tabs) =>
    [
      ...commands,
      ...tabs.map<PaletteEntry>((tab) => ({
        id: `tab:${tab.tabId}`,
        label: `Switch to “${tab.title}”`,
        description: tab.url,
        run: (context) =>
          context.switchToTab(tab.tabId),
      })),
    ]
  );
}

/**
 * Command palette dialog with keyboard navigation.
 */
export function CommandPalette({
  open,
  onClose,
  query,
  onQueryChange,
  onRun,
  className,
}: CommandPaletteProps) {
  const [entries, setEntries] = React.useState<PaletteEntry[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void buildEntries(query).then((list) => {
      if (cancelled) return;
      setEntries(list);
      setActiveIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open]);

  if (!open) return null;

  const activate = (entry: PaletteEntry) => {
    void onRun((api) => entry.run(api));
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        entries.length === 0
          ? 0
          : (current + 1) % entries.length
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        entries.length === 0
          ? 0
          : (current - 1 + entries.length) % entries.length
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const entry = entries[activeIndex];
      if (entry) activate(entry);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-xl border border-input bg-card p-4 shadow-lg',
          className
        )}
        role="dialog"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 rounded-lg border border-input px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Type a command or search the web…"
            aria-label="Command query"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto">
          {entries.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matching commands.
            </p>
          )}
          {entries.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => activate(entry)}
              aria-selected={index === activeIndex}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                index === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              <span className="flex-1">
                <span className="block text-sm text-foreground">{entry.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {entry.description}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>↑ ↓ to navigate · Enter to run</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
