import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listTabs,
  searchTabs,
  switchToTab,
  closeTab,
  findDuplicateUrls,
  openTab,
} from './tabs';

const originalChrome = globalThis.chrome;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function installChrome(tabs: any[]) {
  const query = vi.fn().mockResolvedValue(tabs);
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const create = vi.fn().mockResolvedValue({ id: 999 });
  const contains = vi.fn().mockResolvedValue(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = {
    tabs: { query, update, remove, create },
    permissions: { contains },
    runtime: {},
    sidePanel: {},
    storage: {},
    windows: {},
  };
  return { query, update, remove, create, contains };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

describe('tabs service', () => {
  const sampleTabs = [
    { id: 1, title: 'Google', url: 'https://google.com', active: true, windowId: 1 },
    { id: 2, title: 'GitHub', url: 'https://github.com', active: false, windowId: 1 },
    { id: 3, title: 'GitHub (copy)', url: 'https://github.com', active: false, windowId: 1 },
  ];

  it('lists tabs', async () => {
    const { query } = installChrome(sampleTabs);
    const result = await listTabs();
    expect(query).toHaveBeenCalledWith({});
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Google');
  });

  it('searches tabs by title and URL', async () => {
    installChrome(sampleTabs);
    const byTitle = await searchTabs('Google');
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].id).toBe(1);

    const byUrl = await searchTabs('github.com');
    expect(byUrl).toHaveLength(2);

    const empty = await searchTabs('nothing');
    expect(empty).toHaveLength(0);
  });

  it('switches to a tab', async () => {
    const { update } = installChrome(sampleTabs);
    await switchToTab(2);
    expect(update).toHaveBeenCalledWith(2, { active: true, highlighted: true });
  });

  it('closes a tab', async () => {
    const { remove } = installChrome(sampleTabs);
    await closeTab(2);
    expect(remove).toHaveBeenCalledWith(2);
  });

  it('finds duplicate URLs', async () => {
    installChrome(sampleTabs);
    const dups = await findDuplicateUrls();
    expect(dups).toContain('https://github.com');
  });

  it('degrades gracefully when tabs API missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = undefined;
    expect(await listTabs()).toEqual([]);
    expect(await searchTabs('x')).toEqual([]);
    await expect(switchToTab(1)).resolves.not.toThrow();
    await expect(closeTab(1)).resolves.not.toThrow();
    await expect(openTab('https://example.com')).resolves.not.toThrow();
  });

  it('reports no duplicates when none exist', async () => {
    installChrome([
      { id: 1, title: 'A', url: 'https://a.com', active: true, windowId: 1 },
      { id: 2, title: 'B', url: 'https://b.com', active: false, windowId: 1 },
    ]);
    expect(await findDuplicateUrls()).toEqual([]);
  });
});
