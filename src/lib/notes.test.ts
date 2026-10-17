import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createNote,
  listNotes,
  removeNote,
  sortNotes,
  togglePin,
  updateNote,
} from './notes';
import type { NoteItem } from '@/types';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // Fall back to the localStorage storage so tests stay deterministic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  localStorage.clear();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

describe('notes service', () => {
  it('creates a note with a generated id and persists it', async () => {
    const note = await createNote({ title: 'Shopping', content: 'Milk' });

    expect(note.title).toBe('Shopping');
    expect(note.content).toBe('Milk');
    expect(note.pinned).toBe(false);

    const stored = await listNotes();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(note.id);
  });

  it('lists notes most recently updated first', async () => {
    const first = await createNote({ title: 'A', content: '' });
    const second = await createNote({ title: 'B', content: '' });
    const listed = await listNotes();
    expect(listed.map((note) => note.id)).toEqual([second.id, first.id]);
  });

  it('updates the content of an existing note', async () => {
    const note = await createNote({ title: 'A', content: '' });
    const updated = await updateNote(note.id, { title: 'A', content: 'new' });

    expect(updated).not.toBeNull();
    expect(updated?.content).toBe('new');
    expect(updated?.title).toBe('A');
  });

  it('ignores updates for unknown ids', async () => {
    const result = await updateNote('missing', { title: 'x', content: '' });
    expect(result).toBeNull();
  });

  it('toggles the pinned flag and persists it', async () => {
    const note = await createNote({ title: 'A', content: '' });
    const pinned = await togglePin(note.id);

    expect(pinned?.pinned).toBe(true);
    const listed = await listNotes();
    expect(listed[0].pinned).toBe(true);
  });

  it('removes a note', async () => {
    const note = await createNote({ title: 'A', content: '' });
    await removeNote(note.id);

    expect(await listNotes()).toHaveLength(0);
  });

  it('pins sort before unpinned notes', () => {
    const base: Omit<NoteItem, 'updatedAt' | 'pinned'> = {
      id: 'a',
      title: 'a',
      content: '',
      createdAt: 1,
    };
    const pinned: NoteItem = { ...base, id: 'b', pinned: true, updatedAt: 1 };
    const unpinned: NoteItem = { ...base, id: 'c', pinned: false, updatedAt: 1 };
    void sortNotes([unpinned, pinned]);

    const sorted = sortNotes([unpinned, pinned]);
    expect(sorted[0].id).toBe('b');
  });
});
