import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShortcutItem } from './shortcut-item';
import { cn } from '@/lib/utils';
import type { QuickLink } from '@/types';

export interface ShortcutGridProps {
  links: QuickLink[];
  onOpen: (link: QuickLink) => void;
  onAdd: () => void;
  onEdit: (link: QuickLink) => void;
  onDelete: (link: QuickLink) => void;
  onReorder: (links: QuickLink[]) => void;
  editable: boolean;
  className?: string;
}

/**
 * Responsive grid of quick-access shortcuts with add, edit, delete, and
 * drag-to-reorder support (swap on drop).
 */
export function ShortcutGrid({
  links,
  onOpen,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  editable,
  className,
}: ShortcutGridProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);

  const cols = editable ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  const gap = editable ? 'gap-2' : 'gap-3 sm:gap-4';

  const handleSwap = (draggedId: string, targetId: string) => {
    const fromIndex = links.findIndex((i) => i.id === draggedId);
    const toIndex = links.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...links];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDraggedId(null);
    onReorder(next);
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Quick links</CardTitle>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add link
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`grid ${gap} ${cols}`}>
          {links.map((link) => (
            <ShortcutItem
              key={link.id}
              link={link}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={setDraggedId}
              onDrop={(draggedId, targetId) => handleSwap(draggedId, targetId)}
              editable={editable}
              isDragging={draggedId === link.id}
            />
          ))}
          {editable && links.length < 12 && (
            <ShortcutItem
              link={{ id: '__add__', title: '+', url: '', icon: 'Plus' }}
              onOpen={onAdd}
              onEdit={() => {}}
              onDelete={() => {}}
              editable={false}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
