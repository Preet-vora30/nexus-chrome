/**
 * Recent searches service.
 *
 * Stores the most recent search queries submitted from the dashboard. Kept in
 * `chrome.storage.local` so it survives reloads but is never synced.
 */

import { storage } from './storage';

const RECENT_KEY = 'nexus_recent_searches';

function readRaw(): Promise<unknown> {
  return storage.get<unknown>(RECENT_KEY, []);
}

/** List recent searches, most recent first, without duplicates. */
export async function listRecentSearches(): Promise<string[]> {
  const raw = await readRaw();
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(item);
  }
  return result;
}

/** Prepend a query to the recent searches (most recent first, max 10). */
export async function addRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return listRecentSearches();
  const current = await listRecentSearches();
  const next = [trimmed, ...current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())];
  const limited = next.slice(0, 10);
  await storage.set(RECENT_KEY, limited);
  return limited;
}

/** Remove a single recent search. */
export async function removeRecentSearch(query: string): Promise<string[]> {
  const current = await listRecentSearches();
  const next = current.filter((q) => q !== query);
  await storage.set(RECENT_KEY, next);
  return next;
}

/** Remove every recent search. */
export async function clearRecentSearches(): Promise<void> {
  await storage.set(RECENT_KEY, []);
}
