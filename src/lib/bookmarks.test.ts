import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getBookmarks, searchBookmarks, openBookmark } from './bookmarks';

const originalChrome = globalThis.chrome;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function installChrome(tree: any[]) {
  const getTree = vi.fn().mockResolvedValue(tree);
  const query = vi.fn().mockResolvedValue([]);
  const create = vi.fn().mockResolvedValue({ id: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = {
    bookmarks: { getTree },
    permissions: { contains: vi.fn().mockResolvedValue(true) },
    runtime: {},
    sidePanel: {},
    storage: {},
    tabs: { query, create },
    windows: {},
  };
  return { getTree, query, create };
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
  vi.restoreAllMocks();
});

describe('bookmarks service', () => {
  const tree = [
    {
      id: '10',
      title: 'Bookmarks bar',
      children: [
        { id: '2', title: 'Nexus', url: 'https://nexus.example.com' },
        {
          id: '3',
          title: 'Folder',
          children: [
            { id: '4', title: 'Nested', url: 'https://nested.example.com' },
          ],
        },
      ],
    },
    { id: '0', title: 'root' },
  ];

  it('reads the bookmarks tree', async () => {
    installChrome(tree);
    const result = await getBookmarks();
    const bar = result.find((b) => b.title === 'Bookmarks bar');
    expect(bar).toBeDefined();
    expect(bar?.children?.some((b) => b.title === 'Nexus')).toBe(true);
    expect(bar?.children?.some((b) => b.title === 'Folder')).toBe(true);
    const folder = bar?.children?.find((b) => b.title === 'Folder');
    expect(folder?.children?.some((b) => b.title === 'Nested')).toBe(true);
  });

  it('searches bookmarks by title and URL', async () => {
    installChrome(tree);
    const byTitle = await searchBookmarks('Nexus');
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].url).toBe('https://nexus.example.com');

    const byUrl = await searchBookmarks('nested.example.com');
    expect(byUrl).toHaveLength(1);
    expect(byUrl[0].title).toBe('Nested');

    const empty = await searchBookmarks('zzz');
    expect(empty).toHaveLength(0);
  });

  it('opens a bookmark in a new tab', async () => {
    installChrome(tree);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const create = (globalThis as any).chrome.tabs.create;
    await openBookmark('https://nexus.example.com');
    expect(create).toHaveBeenCalledWith({ url: 'https://nexus.example.com' });
  });

  it('degrades gracefully when bookmarks API missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = undefined;
    expect(await getBookmarks()).toEqual([]);
    expect(await searchBookmarks('x')).toEqual([]);
    await expect(openBookmark('https://example.com')).resolves.not.toThrow();
  });
});
