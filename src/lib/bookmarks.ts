/**
 * Bookmarks service.
 *
 * Uses the `bookmarks` permission. Gracefully handles missing permission.
 * Chrome availability is checked at call time so tests can install the API
 * after importing this module.
 */

export type BookmarkItem = {
  id: string;
  title: string;
  url?: string;
  parent?: string;
  children?: BookmarkItem[];
};

function hasBookmarksApi(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.bookmarks &&
    typeof chrome.bookmarks.getTree === 'function'
  );
}

/** Read the full bookmarks tree (folders + bookmarks). */
export async function getBookmarks(): Promise<BookmarkItem[]> {
  if (!hasBookmarksApi()) return [];
  try {
    const tree = await chrome.bookmarks.getTree();
    const roots = tree.filter(
      (n) => n.id !== '0' && n.id !== '1' && n.id !== '2'
    );
    return mapBookmarkNodes(roots);
  } catch {
    return [];
  }
}

/** Search bookmarks by title or URL (case-insensitive substring match). */
export async function searchBookmarks(query: string): Promise<BookmarkItem[]> {
  const all = await getBookmarks();
  if (!query) return all;
  const q = query.toLowerCase();
  const matches: BookmarkItem[] = [];
  const walk = (items: BookmarkItem[]) => {
    for (const item of items) {
      const titleMatch = item.title.toLowerCase().includes(q);
      const urlMatch = item.url
        ? item.url.toLowerCase().includes(q)
        : false;
      if (titleMatch || urlMatch) matches.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(all);
  return matches;
}

/** Open a bookmark URL in a new tab. */
export async function openBookmark(url: string): Promise<void> {
  const { openTab } = await import('./tabs');
  await openTab(url);
}

function mapBookmarkNodes(nodes: chrome.bookmarks.BookmarkTreeNode[]): BookmarkItem[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    url: node.url ?? undefined,
    parent: node.parentId ?? undefined,
    children: node.children ? mapBookmarkNodes(node.children) : undefined,
  }));
}
