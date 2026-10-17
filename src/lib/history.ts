/**
 * Recent history service.
 *
 * Requires the `history` optional permission. Permission is only requested
 * explicitly (see `requestHistoryPermission`), which the dashboard does when
 * the user enables history-based suggestions. Reads degrade gracefully when
 * the permission is missing or the API is unavailable.
 */

export type HistoryItem = {
  id: string;
  title: string;
  url: string;
  visitTime: number;
  typedCount?: number;
};

function hasHistoryApi(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.history &&
    typeof chrome.history.search === 'function'
  );
}

/** True when the history permission has already been granted. */
export async function hasHistoryPermission(): Promise<boolean> {
  if (!hasHistoryApi()) return false;
  try {
    const granted = await chrome.permissions.contains?.({
      permissions: ['history'],
    });
    return granted === true;
  } catch {
    return false;
  }
}

/**
 * Ask the user for the history permission. Only called from an explicit user
 * action; the dashboard never requests it automatically.
 */
export async function requestHistoryPermission(): Promise<boolean> {
  if (!hasHistoryApi()) return false;
  try {
    const granted = await chrome.permissions.contains?.({
      permissions: ['history'],
    });
    if (granted === true) return true;
    const result = await chrome.permissions.request({
      permissions: ['history'],
    });
    return result === true;
  } catch {
    return false;
  }
}

/** Search recent browsing history, newest first. Requires the permission. */
export async function getRecentHistory(
  query = '',
  maxResults = 10
): Promise<HistoryItem[]> {
  if (!(await hasHistoryPermission())) return [];
  try {
    const results = await chrome.history.search({
      text: query,
      maxResults,
      startTime: 0,
    });
    return results
      .filter((page) => page.url && page.url.startsWith('http'))
      .map((page) => ({
        id: String(page.id ?? page.url),
        title: page.title ?? '',
        url: page.url ?? '',
        visitTime: page.lastVisitTime ?? 0,
        typedCount: page.typedCount,
      }));
  } catch {
    return [];
  }
}
