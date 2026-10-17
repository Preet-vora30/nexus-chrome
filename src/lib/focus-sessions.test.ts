import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFocusSessionsCompleted, addFocusSession } from './focus-sessions';

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

describe('focus session counter', () => {
  it('starts at zero', async () => {
    expect(await getFocusSessionsCompleted()).toBe(0);
  });

  it('counts completed sessions', async () => {
    expect(await addFocusSession()).toBe(1);
    expect(await addFocusSession()).toBe(2);
    expect(await getFocusSessionsCompleted()).toBe(2);
  });

  it('ignores corrupted counters', async () => {
    // Simulate corrupted storage by writing through the shared layer.
    const { storage } = await import('./storage');
    await storage.set('nexus_focus_sessions', -3);
    expect(await getFocusSessionsCompleted()).toBe(0);
  });
});
