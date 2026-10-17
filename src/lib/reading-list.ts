/**
 * Reading list service.
 *
 * Saved pages are persisted in `chrome.storage.local`. An item is only added
 * after an explicit user action ("Save this page"), and every read sanitizes
 * the stored shape.
 */

import { storage } from './storage';
import { openTab } from './tabs';
import type { ReadingItem } from '@/types';

const READING_KEY = 'nexus_reading';

function sanitizeItem(value: unknown, index: number): ReadingItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const id =
    typeof record['id'] === 'string' && record['id'].length > 0
      ? record['id']
      : `reading-${index}-${Date.now()}`;
  const title =
    typeof record['title'] === 'string' ? record['title'] : 'Untitled page';
  const url = typeof record['url'] === 'string' ? record['url'] : '';
  if (!url) return null;
  const savedAt =
    typeof record['savedAt'] === 'number' && Number.isFinite(record['savedAt'])
      ? record['savedAt']
      : Date.now();
  return {
    id,
    title,
    url,
    savedAt,
    read: record['read'] === true,
    faviconUrl:
      typeof record['faviconUrl'] === 'string' ? record['faviconUrl'] : null,
  };
}

function sanitizeList(raw: unknown): ReadingItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw
    .map((item, index) => sanitizeItem(item, index))
    .filter((item): item is ReadingItem => item !== null);
  return items.sort((a, b) => b.savedAt - a.savedAt);
}

/** List saved pages, most recently saved first. */
export async function listReading(): Promise<ReadingItem[]> {
  const raw = await storage.get<unknown>(READING_KEY, []);
  return sanitizeList(raw);
}

/** Persist the full list of saved pages. */
export async function saveReading(items: ReadingItem[]): Promise<void> {
  await storage.set(READING_KEY, items);
}

export interface ReadingDraft {
  title: string;
  url: string;
  faviconUrl?: string | null;
}

/**
 * Save the current tab. Saving the same URL again updates the existing entry
 * instead of creating a duplicate.
 */
export async function saveCurrentTab(draft: ReadingDraft): Promise<ReadingItem> {
  const current = await listReading();
  const now = Date.now();
  const normalize = (url: string) => url.replace(/\/+$/, '');
  const existingIndex = current.findIndex(
    (item) => normalize(item.url) === normalize(draft.url)
  );
  if (existingIndex >= 0) {
    const updated: ReadingItem = {
      ...current[existingIndex],
      title: draft.title,
      faviconUrl: draft.faviconUrl ?? current[existingIndex].faviconUrl,
      savedAt: now,
    };
    const next = [...current];
    next[existingIndex] = updated;
    await saveReading(next);
    return updated;
  }
  const item: ReadingItem = {
    id: crypto.randomUUID(),
    title: draft.title,
    url: draft.url,
    savedAt: now,
    read: false,
    faviconUrl: draft.faviconUrl ?? null,
  };
  const next = [item, ...current];
  await saveReading(next);
  return item;
}

export async function setReadingRead(id: string, read: boolean): Promise<void> {
  const items = await listReading();
  await saveReading(
    items.map((item) => (item.id === id ? { ...item, read } : item))
  );
}

/** Remove a saved page. */
export async function removeReading(id: string): Promise<void> {
  const items = await listReading();
  await saveReading(items.filter((item) => item.id !== id));
}

/** Open a saved page in a new tab. */
export function openReading(item: ReadingItem): Promise<void> {
  return openTab(item.url);
}
