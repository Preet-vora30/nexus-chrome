import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { QuickLink } from '@/types';

export interface ShortcutEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (link: Omit<QuickLink, 'id'>) => void;
  initial?: QuickLink;
  editing: boolean;
}

/**
 * Add / edit shortcut form with title, URL, optional icon, and a live preview.
 */
export function ShortcutEditor({
  open,
  onClose,
  onSave,
  initial,
  editing,
}: ShortcutEditorProps) {
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [url, setUrl] = React.useState(initial?.url ?? '');
  const [icon, setIcon] = React.useState(initial?.icon ?? '');
  const [titleError, setTitleError] = React.useState(false);
  const [urlError, setUrlError] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setUrl(initial.url);
      setIcon(initial.icon ?? '');
    } else {
      setTitle('');
      setUrl('');
      setIcon('');
    }
    setTitleError(false);
    setUrlError(false);
  }, [open, initial]);

  const isUrlValid = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed);
    }
  };

  const handleSave = () => {
    setTitleError(!title.trim());
    const trimmedUrl = url.trim();
    setUrlError(!trimmedUrl || !isUrlValid(trimmedUrl));
    if (!title.trim() || !trimmedUrl || !isUrlValid(trimmedUrl)) return;

    let finalUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    onSave({ title: title.trim(), url: finalUrl, icon: icon.trim() || undefined });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit shortcut' : 'Add shortcut'}
      description={
        editing
          ? 'Update the title, URL, or icon for this quick link.'
          : 'Enter a title and URL for quick access from the dashboard.'
      }
      onConfirm={handleSave}
      confirmLabel={editing ? 'Save' : 'Add'}
      cancelLabel="Cancel"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. GitHub"
              className={cn(
                'border-input',
                titleError ? 'border-destructive' : ''
              )}
            />
            {titleError && !title.trim() && (
              <span className="text-xs text-destructive">Title is required</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">URL</label>
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://github.com"
              className={cn('border-input', urlError ? 'border-destructive' : '')}
            />
            {urlError && (
              <span className="text-xs text-destructive">
                {url.trim() ? 'Enter a valid URL' : 'URL is required'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Icon (emoji or URL)</label>
          <Input
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="★ or https://example.com/icon.png"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <Avatar src={icon || undefined} label={title || 'Link'} size="sm" />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
