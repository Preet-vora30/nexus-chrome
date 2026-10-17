import * as React from 'react';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { TabItem } from '@/types';

export interface WidgetTabsProps {
  visible: boolean;
  tabs: TabItem[];
  loading: boolean;
  error: string | null;
  onSwitch: (tabId: number) => void;
  onClose: (tabId: number) => void;
  onRefresh: () => void;
  className?: string;
}

/**
 * Recent tabs widget showing open tabs from the current window.
 */
export function WidgetTabs({
  visible,
  tabs,
  loading,
  error,
  onSwitch,
  onClose,
  onRefresh,
  className,
}: WidgetTabsProps) {
  if (!visible) return null;

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open tabs</span>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader size={14} /> : <span className="hidden sm:inline">Refresh</span>}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading && !tabs.length && (
        <div className="flex items-center justify-center h-24">
          <Loader size={16} />
        </div>
      )}

      {!loading && tabs.length === 0 && !error && (
        <EmptyState
          icon={SquareLayerIcon}
          title="No open tabs"
          description="Open a few tabs and they'll appear here."
          onAction={onRefresh}
          actionLabel="Refresh"
        />
      )}

      {!loading && tabs.length > 0 && (
        <div className="max-h-[220px] overflow-y-auto space-y-1.5">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="flex items-center gap-3 rounded-lg border border-input p-2 hover:bg-accent transition-colors group"
            >
              <Avatar src={tab.favIconUrl ?? undefined} label={tab.title} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate text-foreground" title={tab.title}>
                  {tab.title}
                </div>
                <div className="text-xs text-muted-foreground truncate" title={tab.url}>
                  {tab.url}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onSwitch(tab.id);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`Switch to ${tab.title}`}
                >
                  <span className="h-3 w-3" aria-hidden="true">▸</span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose(tab.id);
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Close ${tab.title}`}
                >
                  <span className="h-3 w-3" aria-hidden="true">✕</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fallback icon (lucide not tree-shaken here; inline svg)
const SquareLayerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M3 3l18 18" />
  </svg>
);
