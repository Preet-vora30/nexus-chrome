import { History, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecentSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Dropdown list of recent searches with remove and clear-all actions.
 */
export function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
  className,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute z-30 mt-1 w-full rounded-xl border border-input bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2',
        className
      )}
    >
      <div className="border-b border-input px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent searches
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-destructive hover:text-destructive/90 transition-colors p-1"
          aria-label="Clear recent searches"
        >
          Clear all
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {searches.map((query) => (
          <button
            key={query}
            onClick={() => onSelect(query)}
            onMouseDown={(event) => event.preventDefault()}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent focus:bg-accent"
          >
            <span className="text-muted-foreground/50">{query}</span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onRemove(query);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
              aria-label={`Remove "${query}"`}
            >
              <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
