/**
 * Notes service.
 *
 * Notes are persisted in `chrome.storage.local` through the shared storage
 * layer. Every read sanitizes the stored shape so corrupted entries are
 * replaced instead of breaking the dashboard.
 */

import { storage } from './storage';
import type { NoteItem } from '@/types';

export interface NoteDraft {
  title: string;
  content: string;
}

const NOTES_KEY = 'nexus_notes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function str(value: Record<string, unknown>, key: string): string | undefined {
  const raw = value[key];
  return typeof raw === 'string' ? raw : undefined;
}

function num(value: Record<string, unknown>, key: string): number | undefined {
  const raw = value[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

function sanitizeNote(value: unknown, index: number): NoteItem | null {
  if (!isRecord(value)) return null;
  const idValue = value['id'];
  const id =
    typeof idValue === 'string' && idValue.length > 0
      ? idValue
      : `note-${index}-${Date.now()}`;
  const title = str(value, 'title') ?? 'Untitled note';
  const content = str(value, 'content') ?? '';
  const pinned = value['pinned'] === true;
  const createdAt =
    num(value, 'createdAt') ?? Date.now();
  const updatedAt =
    num(value, 'updatedAt') ?? createdAt;
  return { id, title, content, pinned, createdAt, updatedAt };
}

/** Sort notes: pinned notes first, then most recently updated. */
export function sortNotes(notes: NoteItem[]): NoteItem[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

/** List all notes, most recently updated first. */
export async function listNotes(): Promise<NoteItem[]> {
  const raw = await storage.get<unknown>(NOTES_KEY, []);
  if (!Array.isArray(raw)) return [];
  const notes = raw
    .map((item, index) => sanitizeNote(item, index))
    .filter((note): note is NoteItem => note !== null);
  return sortNotes(notes);
}

/** Persist the full, sanitized list of notes. */
export async function saveNotes(notes: NoteItem[]): Promise<void> {
  const clean = notes.map((note, index) => sanitizeNote(note, index));
  await storage.set(NOTES_KEY, clean);
}

export async function createNote(draft: NoteDraft): Promise<NoteItem> {
  const now = Date.now();
  const note: NoteItem = {
    id: crypto.randomUUID(),
    title: draft.title.trim() || 'Untitled note',
    content: draft.content,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  const notes = await listNotes();
  notes.unshift(note);
  await saveNotes(notes);
  return note;
}

export async function updateNote(
  id: string,
  draft: NoteDraft
): Promise<NoteItem | null> {
  const notes = await listNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return null;
  const current = notes[index];
  const updated: NoteItem = {
    ...current,
    title: draft.title.trim() || current.title,
    content: draft.content,
    updatedAt: Date.now(),
  };
  notes[index] = updated;
  await saveNotes(notes);
  return updated;
}

export async function removeNote(id: string): Promise<void> {
  const notes = await listNotes();
  await saveNotes(notes.filter((note) => note.id !== id));
}

export async function togglePin(id: string): Promise<NoteItem | null> {
  const notes = await listNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return null;
  const current = notes[index];
  const pinned = !current.pinned;
  const updated: NoteItem = { ...current, pinned, updatedAt: Date.now() };
  notes[index] = updated;
  await saveNotes(notes);
  return updated;
}
