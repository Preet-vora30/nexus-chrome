/**
 * Tab manager service.
 *
 * Uses the optional `tabs` permission. All functions degrade gracefully when
 * the permission has not been granted or the API is unavailable (e.g. in
 * tests or on restricted pages). Chrome availability is checked at call time
 * so tests can install the API after importing this module.
 */

export type TabItem = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string | null;
  active: boolean;
  windowId: number;
};

function hasTabsApi(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.tabs &&
    typeof chrome.tabs.query === 'function'
  );
}

/** List all accessible open tabs across the current window. */
export async function listTabs(): Promise<TabItem[]> {
  if (!hasTabsApi()) return [];
  try {
    const tabs = await chrome.tabs.query({});
    return tabs
      .filter((t) => t.id !== undefined)
      .map((t) => ({
        id: t.id!,
        title: t.title ?? '',
        url: t.url ?? '',
        favIconUrl: t.favIconUrl ?? null,
        active: t.active ?? false,
        windowId: t.windowId ?? -1,
      }));
  } catch {
    return [];
  }
}

/** Search tabs by title or URL (case-insensitive substring match). */
export async function searchTabs(query: string): Promise<TabItem[]> {
  const all = await listTabs();
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(
    (t) => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q)
  );
}

/** Switch focus to an existing tab. */
export async function switchToTab(tabId: number): Promise<void> {
  if (!hasTabsApi()) return;
  try {
    await chrome.tabs.update(tabId, { active: true, highlighted: true });
    try {
      await chrome.windows.update(
        chrome.windows.WINDOW_ID_CURRENT,
        { focused: true }
      );
    } catch {
      // Window focus not available — non-fatal.
    }
  } catch {
    // Silently ignore — tab may have been closed.
  }
}

/** Close a tab by id. */
export async function closeTab(tabId: number): Promise<void> {
  if (!hasTabsApi()) return;
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // Silently ignore — tab may already be closed.
  }
}

/** Detect duplicate URLs across open tabs. Returns groups of tab ids. */
export async function findDuplicateUrls(): Promise<string[]> {
  const all = await listTabs();
  const counts = new Map<string, number>();
  for (const t of all) {
    counts.set(t.url, (counts.get(t.url) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([url]) => url);
}

/** Open a URL in a new tab. */
export async function openTab(url: string): Promise<void> {
  if (!hasTabsApi()) return;
  try {
    await chrome.tabs.create({ url });
  } catch {
    // Silently ignore.
  }
}
