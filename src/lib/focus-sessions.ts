/**
 * Focus session counter.
 *
 * Counts completed focus sessions so the productivity summary can show real
 * numbers. Stored locally; never synced.
 */

import { storage } from './storage';

const FOCUS_COUNT_KEY = 'nexus_focus_sessions';

function sanitizeCount(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
    ? Math.floor(raw)
    : 0;
}

export async function getFocusSessionsCompleted(): Promise<number> {
  const raw = await storage.get<unknown>(FOCUS_COUNT_KEY, 0);
  return sanitizeCount(raw);
}

/** Record one completed focus session. */
export async function addFocusSession(): Promise<number> {
  const current = await getFocusSessionsCompleted();
  const next = current + 1;
  await storage.set(FOCUS_COUNT_KEY, next);
  return next;
}
