import * as React from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { ReadingItem } from '@/types';

export interface WidgetReadingProps {
  visible: boolean;
  items: ReadingItem[];
  loading: boolean;
  error: string | null;
  onSaveCurrent: () => void;
  onSaveUrl: (url: string) => void;
  onOpen: (item: ReadingItem) => void;
  onToggleRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
  className?: string;
}

/**
 * Reading list: pages the user explicitly saved. Saved pages can be marked
 * read or unread, opened, searched, and deleted.
 */
export function WidgetReading({
  visible,
  items,
  loading,
  error,
  onSaveCurrent,
  onSaveUrl,
  onOpen,
  onToggleRead,
  onDelete,
  className,
}: WidgetReadingProps) {
  const [draft, setDraft] = React.useState('');
  if (!visible) return null;

  const saveUrl = () => {
    const url = draft.trim();
    if (!url) return;
    onSaveUrl(url);
    setDraft('');
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reading list
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onSaveCurrent}
          disabled={loading}
        >
          Save current tab
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') saveUrl();
          }}
          placeholder="Paste a URL to save"
          aria-label="URL to save"
        />
        <Button size="sm" onClick={saveUrl} disabled={!draft.trim()}>
          Save
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="flex items-center justify-center h-24">
          <Loader size={16} />
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <EmptyState
          icon={BookIcon}
          title="Reading list is empty"
          description="Save the current tab or paste a URL to read later."
          actionLabel="Save current tab"
          onAction={onSaveCurrent}
        />
      )}

      {!loading && items.length > 0 && (
        <div className="max-h-[220px] overflow-y-auto space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-input p-2 hover:bg-accent transition-colors group"
            >
              <Button
                onClick={() => onOpen(item)}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
                aria-label={`Open ${item.title}`}
              >
                <Avatar
                  src={item.faviconUrl ?? undefined}
                  label={item.title}
                  size="sm"
                />
                <span className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'block truncate text-sm text-foreground',
                      item.read && 'line-through text-muted-foreground'
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.url}
                  </span>
                </span>
              </Button>
              <Button
                onClick={() => onToggleRead(item.id, !item.read)}
                className="rounded-md p-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label={item.read ? `Mark ${item.title} unread` : `Mark ${item.title} read`}
              >
                <span className="h-3.5 w-3.5" aria-hidden="true">
                  {item.read ? '✓' : '○'}
                </span>
              </Button>
              <Button
                onClick={() => onDelete(item.id)}
                className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Delete ${item.title}`}
              >
                <span className="h-3.5 w-3.5" aria-hidden="true">✕</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
