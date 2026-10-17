/**
 * Smart search bar.
 *
 * Shows live suggestions built from real extension data (recent searches,
 * bookmarks, history when permitted, open tabs). Suggestions are debounced,
 * navigable with the arrow keys, and activated with Enter.
 */

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildSuggestions,
  collectSuggestionData,
  SOURCE_LABELS,
  type Suggestion,
} from '@/lib/suggestions';

const DEBOUNCE_MS = 250;

export interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Called when the panel should close (Escape). */
  onClose: () => void;
  /** Whether history may be used for suggestions (user opted in). */
  includeHistory: boolean;
  /** Recent searches, most recent first. */
  recentSearches: string[];
  /** Ref that is attached to the underlying input. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Called to remove a single recent search. */
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
}

/** Split `text` around case-insensitive matches of `query`. */
export function highlightParts(
  text: string,
  query: string
): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let index = 0;
  for (;;) {
    const found = lower.indexOf(needle, index);
    if (found === -1) {
      const rest = text.slice(index);
      if (rest.length > 0) {
        parts.push({ text: rest, match: false });
      }
      break;
    }
    if (found > index) {
      parts.push({ text: text.slice(index, found), match: false });
    }
    parts.push({ text: text.slice(found, found + needle.length), match: true });
    index = found + needle.length;
  }
  return parts;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = React.useMemo(
    () => highlightParts(text, query),
    [text, query]
  );
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={index}
            className="rounded bg-accent/40 px-0.5 text-foreground"
            aria-hidden="true"
          >
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * Smart search input with debounced, keyboard navigable suggestions.
 */
export function SmartSearch({
  value,
  onChange,
  onSubmit,
  onClose,
  includeHistory,
  recentSearches,
  inputRef,
  onRemoveRecentSearch,
  onClearRecentSearches,
}: SmartSearchProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const data = await collectSuggestionData(includeHistory);
        const built = buildSuggestions({
          query: value,
          recentSearches,
          bookmarks: data.bookmarks,
          history: data.history,
          tabs: data.tabs,
        });
        if (cancelled) return;
        setSuggestions(built);
        setActiveIndex(0);
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, includeHistory, recentSearches]);

  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, value]);

  const showPanel = open && value.trim().length > 0;

  const activate = (suggestion: Suggestion) => {
    if (suggestion.kind === 'open' && suggestion.url) {
      onSubmit(suggestion.url);
      return;
    }
    if (suggestion.query) {
      onSubmit(suggestion.query);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        suggestions.length === 0
          ? 0
          : (current + 1) % suggestions.length
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        suggestions.length === 0
          ? 0
          : (current - 1 + suggestions.length) % suggestions.length
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        activate(suggestions[activeIndex]);
      } else {
        onSubmit(value.trim());
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    activate(suggestion);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a URL"
          aria-label="Search the web"
          spellCheck={false}
          autoComplete="off"
        />
        {value.length > 0 && (
          <button
            type="button"
            className="p-1 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              onClose();
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {showPanel && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-input bg-card shadow-lg animate-in fade-in slide-in-from-top-2"
        >
          <div className="max-h-72 overflow-y-auto p-1">
            {suggestions.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No suggestions. Press Enter to search.
              </p>
            )}
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  index === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
                )}
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm text-foreground">
                    <Highlighted text={suggestion.title} query={value.trim()} />
                  </span>
                  {suggestion.kind === 'open' && suggestion.url && (
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      title={suggestion.url}
                    >
                      {suggestion.url}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {SOURCE_LABELS[suggestion.source]}
                </span>
              </button>
            ))}
          </div>
          {recentSearches.length > 0 && (
            <div className="flex items-center justify-between border-t border-input px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {recentSearches.length} recent search
                {recentSearches.length === 1 ? '' : 'es'}
              </span>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline"
                  onClick={() => onRemoveRecentSearch(search)}
                >
                  {search}
                  <span className="sr-only">remove</span>
                </button>
              ))}
              <button
                type="button"
                className="text-xs text-destructive transition-colors hover:text-destructive/90"
                onClick={onClearRecentSearches}
              >
                Clear recent searches
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
