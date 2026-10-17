import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addRecentSearch,
  clearRecentSearches,
  listRecentSearches,
  removeRecentSearch,
} from './recent-searches';

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

describe('recent searches service', () => {
  it('lists submitted searches most recent first', async () => {
    await addRecentSearch('second search');
    await addRecentSearch('first search');

    const listed = await listRecentSearches();
    expect(listed[0]).toBe('first search');
    expect(listed[1]).toBe('second search');
  });

  it('deduplicates repeated submissions and caps the list at ten', async () => {
    for (let index = 0; index < 12; index += 1) {
      await addRecentSearch(`query ${index}`);
    }
    const listed = await listRecentSearches();
    expect(listed).toHaveLength(10);
    expect(listed[0]).toBe('query 11');
    expect(listed).not.toContain('query 0');
  });

  it('removes a single recent search', async () => {
    await addRecentSearch('keep');
    await addRecentSearch('remove me');
    await removeRecentSearch('remove me');

    const listed = await listRecentSearches();
    expect(listed).toEqual(['keep']);
  });

  it('clears every recent search', async () => {
    await addRecentSearch('a');
    await addRecentSearch('b');
    await clearRecentSearches();

    expect(await listRecentSearches()).toEqual([]);
  });
});
