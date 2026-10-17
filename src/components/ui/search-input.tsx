import * as React from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  engine?: { name: string; icon: string };
}

/**
 * Prominent search bar with URL detection, clear button, engine chip, and
 * keyboard handling (Enter to submit, Escape to clear).
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search or type a URL',
  disabled = false,
  loading = false,
  engine,
}: SearchInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit(value.trim());
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onClear?.();
    }
  };

  const isUrl = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    if (/^https?:\/\//i.test(trimmed)) return true;
    if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed))
      return true;
    return false;
  };

  return (
    <div className="flex w-full max-w-2xl items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-center gap-2 text-muted-foreground">
        {engine && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-medium"
            title={engine.name}
          >
            <span aria-hidden="true">{engine.icon}</span>
          </div>
        )}
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <input
        className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
        spellCheck={false}
        autoComplete="off"
      />
      {isUrl(value) ? (
        <button
          onClick={() => onSubmit(value.trim())}
          disabled={disabled || loading}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Go to URL"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : value.length > 0 && !loading ? (
        <button
          onClick={onClear}
          disabled={disabled}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label="Clear"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        loading ? (
          <span className="h-4 w-4" />
        ) : null
      )}
    </div>
  );
}
