import * as React from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { BookmarkItem } from '@/types';

export interface WidgetBookmarksProps {
  visible: boolean;
  bookmarks: BookmarkItem[];
  loading: boolean;
  error: string | null;
  onOpen: (url: string) => void;
  onRefresh: () => void;
  className?: string;
}

/**
 * Bookmarks widget showing top-level bookmarks and folders.
 */
export function WidgetBookmarks({
  visible,
  bookmarks,
  loading,
  error,
  onOpen,
  onRefresh,
  className,
}: WidgetBookmarksProps) {
  if (!visible) return null;

  const flat = bookmarks.flatMap((b) =>
    b.url ? [b] : (b.children ?? []).map((c) => ({ ...c, parent: b.title }))
  );

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bookmarks</span>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader size={14} /> : <span className="hidden sm:inline">Refresh</span>}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && !bookmarks.length && (
        <div className="flex items-center justify-center h-24">
          <Loader size={16} />
        </div>
      )}

      {!loading && flat.length === 0 && !error && (
        <EmptyState
          icon={BookIcon}
          title="No bookmarks"
          description="Save some pages and they'll appear here."
          onAction={onRefresh}
          actionLabel="Refresh"
        />
      )}

      {!loading && flat.length > 0 && (
        <div className="max-h-[220px] overflow-y-auto space-y-1.5">
          {flat.map((bookmark) => (
            <button
              key={bookmark.id}
              onClick={() => bookmark.url && onOpen(bookmark.url)}
              className="flex items-center gap-3 rounded-lg border border-transparent bg-transparent p-2 text-left text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar src={undefined} label={bookmark.title} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" title={bookmark.title}>
                  {bookmark.title}
                </div>
                {bookmark.parent && (
                  <div className="text-xs text-muted-foreground truncate">
                    {bookmark.parent}
                  </div>
                )}
              </div>
            </button>
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
