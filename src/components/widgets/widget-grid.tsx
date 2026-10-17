import * as React from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetGridItem {
  id: string;
  title: string;
  visible: boolean;
}

export interface WidgetGridProps {
  widgets: WidgetGridItem[];
  onToggle: (id: string) => void;
  /** Reorder widgets: `ids` is the new display order. */
  onReorder: (ids: string[]) => void;
  /** Restore the default widget order. */
  onResetLayout: () => void;
  className?: string;
}

/**
 * Layout control for dashboard widgets: show/hide widgets, drag or keyboard
 * reorder them, and restore the default layout.
 *
 * Drag and drop uses the browser's native HTML5 DnD API, which is supported
 * by Chrome extension pages. When dragging is unavailable (or the page is
 * running in an environment without DnD support), the keyboard alternative
 * — ↑ / ↓ arrow keys and the move buttons — still works.
 */
export function WidgetGrid({
  widgets,
  onToggle,
  onReorder,
  onResetLayout,
  className,
}: WidgetGridProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const handleSwap = (fromIndex: number, toIndex: number) => {
    const next = [...widgets];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next.map((widget) => widget.id));
  };

  const moveBy = (offset: number) => {
    const currentIndex = focusedIndex ?? 0;
    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;
    handleSwap(currentIndex, nextIndex);
    setFocusedIndex(nextIndex);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveBy(1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setFocusedIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setFocusedIndex(widgets.length - 1);
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Dashboard widgets</h3>
        <button
          type="button"
          onClick={onResetLayout}
          className="flex items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Restore default widget layout"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset layout
        </button>
      </div>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable
            onDragStart={(event) => {
              setDraggedId(widget.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', widget.id);
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const draggedId = event.dataTransfer.getData('text/plain');
              const fromIndex = widgets.findIndex(
                (item) => item.id === draggedId
              );
              if (fromIndex >= 0 && fromIndex !== index) {
                handleSwap(fromIndex, index);
              }
              setDraggedId(null);
              setFocusedIndex(null);
            }}
            className={cn(
              'flex flex-col gap-2 rounded-lg border border-input bg-card p-3 text-left transition-opacity',
              draggedId === widget.id ? 'opacity-50' : '',
              widget.visible ? 'bg-card' : 'opacity-60'
            )}
            data-widget-id={widget.id}
            tabIndex={0}
            onFocus={() => setFocusedIndex(index)}
            aria-label={`${widget.title}: ${widget.visible ? 'visible' : 'hidden'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{widget.title}</span>
              <span className="text-xs text-muted-foreground">
                {widget.visible ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggle(widget.id)}
                aria-pressed={widget.visible}
                className="flex items-center gap-1.5 text-xs"
              >
                {widget.visible ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Show
                  </>
                )}
              </button>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="p-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    moveBy(-1);
                  }}
                  disabled={focusedIndex === 0}
                  aria-label="Move widget up"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="p-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    moveBy(1);
                  }}
                  disabled={focusedIndex !== null && focusedIndex >= widgets.length - 1}
                  aria-label="Move widget down"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
