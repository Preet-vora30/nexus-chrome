import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { QuickLink } from '@/types';

export interface ShortcutItemProps {
  link: QuickLink;
  onOpen: (link: QuickLink) => void;
  onEdit: (link: QuickLink) => void;
  onDelete: (link: QuickLink) => void;
  onDragStart?: (id: string) => void;
  onDrop?: (draggedId: string, targetId: string) => void;
  editable?: boolean;
  isDragging?: boolean;
}

/**
 * A single quick-access shortcut: opens on click, edit/delete when in edit mode.
 */
export function ShortcutItem({
  link,
  onOpen,
  onEdit,
  onDelete,
  onDragStart,
  onDrop,
  editable = false,
  isDragging = false,
}: ShortcutItemProps) {
  const handleOpen = (event: React.MouseEvent) => {
    if (editable && (event.target as HTMLElement).closest('[data-action]')) {
      return;
    }
    event.preventDefault();
    onOpen(link);
  };

  return (
    <div
      className={cn(
        'relative group flex flex-col items-center justify-center gap-1.5 rounded-lg border border-input bg-card p-2.5 text-center transition-colors',
        isDragging ? 'opacity-50 scale-95' : 'hover:bg-accent/50 hover:border-accent/50'
      )}
      draggable={editable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', link.id);
        onDragStart?.(link.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== link.id) {
          onDrop?.(draggedId, link.id);
        }
      }}
    >
      <button
        onClick={handleOpen}
        onAuxClick={(event) => {
          if (event.button === 1) {
            event.preventDefault();
            const win = window.open(link.url, '_blank');
            if (win) win.focus();
          }
        }}
        className="flex flex-col items-center justify-center gap-1.5 w-full h-full rounded-md p-3 text-sm text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Avatar src={link.icon} label={link.title} size="md" />
        <span className="line-clamp-1">{link.title}</span>
      </button>
      {editable && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onEdit(link);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            data-action="edit"
            aria-label={`Edit ${link.title}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(link);
            }}
            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
            data-action="delete"
            aria-label={`Delete ${link.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
