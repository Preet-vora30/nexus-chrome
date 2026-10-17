import * as React from 'react';
import { Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { NoteItem } from '@/types';

export interface NoteDraft {
  title: string;
  content: string;
}

export interface WidgetNotesProps {
  visible: boolean;
  notes: NoteItem[];
  onCreate: (draft: NoteDraft) => Promise<void>;
  onUpdate: (id: string, draft: NoteDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  className?: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Notes widget: create, edit, pin, search, and delete persisted notes.
 * Edits are saved automatically after a short debounce.
 */
export function WidgetNotes({
  visible,
  notes,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
  className,
}: WidgetNotesProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('');
  const [editorContent, setEditorContent] = React.useState('');
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? notes.filter(
          (note) =>
            note.title.toLowerCase().includes(q) ||
            note.content.toLowerCase().includes(q)
        )
      : notes;
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, query]);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!visible) return null;

  const beginEdit = (noteId: string) => {
    setEditingId(noteId);
    const note = notes.find((item) => item.id === noteId);
    setEditorTitle(note?.title ?? '');
    setEditorContent(note?.content ?? '');
  };

  const cancelEdit = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setEditingId(null);
  };

  const scheduleSave = (noteId: string, title: string, content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void onUpdate(noteId, { title, content });
    }, 400);
  };

  const startCreate = () => {
    setEditingId('new');
    setEditorTitle('');
    setEditorContent('');
  };

  const commitDraft = () => {
    const title = editorTitle.trim();
    const content = editorContent;
    if (editingId === 'new') {
      if (title) {
        void onCreate({ title, content });
      }
    } else if (editingId) {
      scheduleSave(editingId, title, content);
    }
    setEditingId(null);
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </span>
        <Button size="sm" variant="ghost" onClick={startCreate} aria-label="New note">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          className="pl-8"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes"
        />
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs italic text-muted-foreground">
            {notes.length === 0
              ? 'No notes yet. Create your first note!'
              : 'No notes match your search.'}
          </p>
        ) : (
          filtered.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-input bg-card p-2"
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={editorTitle}
                    onChange={(event) => setEditorTitle(event.target.value)}
                    placeholder="Note title"
                    aria-label="Note title"
                    className="min-h-8 py-1"
                  />
                  <textarea
                    className="min-h-[80px] w-full resize-y rounded-md border border-input bg-transparent p-2 text-sm outline-none"
                    value={editorContent}
                    onChange={(event) => setEditorContent(event.target.value)}
                    placeholder="Write your note…"
                    aria-label="Note content"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        commitDraft();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEdit();
                      }
                    }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={commitDraft}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 truncate text-sm font-medium">
                      {note.pinned && (
                        <Pin className="mr-1 inline h-3 w-3 text-primary" aria-hidden="true" />
                      )}
                      {note.title || 'Untitled note'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1"
                      onClick={() => beginEdit(note.id)}
                      aria-label={`Edit note ${note.title}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void onTogglePin(note.id)}
                      aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                      {note.pinned ? (
                        <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                    {note.content || 'No content'}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Edited {formatTime(note.updatedAt)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-1 text-destructive hover:text-destructive/90"
                      onClick={() => {
                        if (window.confirm('Delete this note permanently?')) {
                          void onDelete(note.id);
                        }
                      }}
                      aria-label={`Delete note ${note.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
