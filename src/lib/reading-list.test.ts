import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  listReading,
  removeReading,
  saveCurrentTab,
  saveReading,
  setReadingRead,
} from './reading-list';
import type { ReadingItem } from '@/types';

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

describe('reading list service', () => {
  it('saves a page and lists it newest first', async () => {
    const item = await saveCurrentTab({ title: 'Example', url: 'https://example.com' });

    const listed = await listReading();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(item.id);
    expect(listed[0].read).toBe(false);
  });

  it('saves the current tab and marks it read', async () => {
    const item = await saveCurrentTab({
      title: 'Current',
      url: 'https://current.example',
      faviconUrl: 'https://current.example/favicon.ico',
    });
    await setReadingRead(item.id, true);

    const listed = await listReading();
    expect(listed[0].read).toBe(true);
    expect(listed[0].faviconUrl).toBe('https://current.example/favicon.ico');
  });

  it('updates an existing entry instead of duplicating it', async () => {
    await saveCurrentTab({ title: 'Example', url: 'https://example.com/page' });
    const updated = await saveCurrentTab({
      title: 'Renamed',
      url: 'https://example.com/page/',
    });

    const listed = await listReading();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(updated.id);
    expect(listed[0].title).toBe('Renamed');
  });

  it('removes an entry', async () => {
    const item = await saveCurrentTab({ title: 'Example', url: 'https://example.com' });
    await removeReading(item.id);

    expect(await listReading()).toHaveLength(0);
  });

  it('drops entries without a url', async () => {
    await saveReading([
      { id: 'bad', title: 'No url', url: '', savedAt: 1, read: false },
      { id: 'good', title: 'Good', url: 'https://good.example', savedAt: 2 },
    ] as unknown as ReadingItem[]);

    const listed = await listReading();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe('good');
  });
});
