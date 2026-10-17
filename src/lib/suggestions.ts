/**
 * Smart search suggestion service.
 *
 * Suggestions are built exclusively from real extension data:
 *  - recent searches stored by this extension,
 *  - Chrome bookmarks,
 *  - Chrome browsing history (only when the history permission is granted),
 *  - tabs that are already open,
 *  - the typed input itself when it looks like a URL.
 *
 * Nothing is scraped from web pages and no search engine is contacted here;
 * running a search only happens when the user submits it.
 */

import { getBookmarks } from './bookmarks';
import { getRecentHistory } from './history';
import { listTabs } from './tabs';
import type { BookmarkItem, HistoryItem, TabItem } from '@/types';

export type SuggestionSource =
  | 'recent-searches'
  | 'bookmarks'
  | 'history'
  | 'open-tabs';

export type SuggestionKind = 'search' | 'open';

export type MatchRank = 'exact' | 'prefix' | 'contains';

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  /** Text to run when the suggestion is activated. */
  query?: string;
  /** URL to open when the suggestion is activated. */
  url?: string;
  title: string;
  source: SuggestionSource;
  rank: MatchRank;
}

export const SOURCE_LABELS: Record<SuggestionSource, string> = {
  'recent-searches': 'Recent searches',
  bookmarks: 'Bookmarks',
  history: 'History',
  'open-tabs': 'Open tabs',
};

export interface SuggestionInput {
  query: string;
  recentSearches: string[];
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  tabs: TabItem[];
}

const normalize = (value: string): string => value.trim().toLowerCase();

const startsWith = (value: string, query: string): boolean =>
  query.length === 0 || value.startsWith(query);

function rankOf(query: string, url: string, title: string): MatchRank {
  const q = normalize(query);
  const normalizedUrl = normalize(url);
  const normalizedTitle = normalize(title);
  if (q.length === 0) return 'contains';
  if (q === normalizedUrl || q === normalizedTitle) return 'exact';
  if (startsWith(normalizedUrl, q)) return 'prefix';
  if (normalizedTitle.includes(q)) return 'contains';
  return 'contains';
}

/**
 * Build the suggestion list for the current input.
 *
 * Pure with respect to its arguments (no Chrome APIs), which keeps the
 * ranking logic unit-testable.
 */
export function buildSuggestions(input: SuggestionInput): Suggestion[] {
  const query = input.query.trim();
  const q = normalize(query);
  const suggestions: Suggestion[] = [];
  const seenUrls = new Set<string>();

  const push = (suggestion: Suggestion): void => {
    if (suggestions.some((s) => s.id === suggestion.id)) return;
    suggestions.push(suggestion);
  };

  /**
   * URL targets are collected per source so duplicates can be skipped.
   * Open tabs win over bookmarks and history because they are live.
   */
  const urlTargets: Array<{
    url: string;
    title: string;
    source: SuggestionSource;
  }> = [];
  for (const tab of input.tabs) {
    if (!tab.url) continue;
    urlTargets.push({ url: tab.url, title: tab.title || tab.url, source: 'open-tabs' });
  }
  for (const bookmark of input.bookmarks) {
    if (!bookmark.url) continue;
    urlTargets.push({
      url: bookmark.url,
      title: bookmark.title,
      source: 'bookmarks',
    });
  }
  for (const page of input.history) {
    if (!page.url) continue;
    urlTargets.push({
      url: page.url,
      title: page.title || page.url,
      source: 'history',
    });
  }

  for (const target of urlTargets) {
    const normalizedUrl = normalize(target.url);
    if (seenUrls.has(normalizedUrl)) continue;
    const rank = rankOf(query, target.url, target.title);
    push({
      id: `open:${normalizedUrl}`,
      kind: 'open',
      url: target.url,
      title: target.title,
      source: target.source,
      rank,
    });
    seenUrls.add(normalizedUrl);
  }

  // Recent searches are suggested while typing (deduplicated).
  const seenSearches = new Set<string>();
  for (const recent of input.recentSearches) {
    const normalized = normalize(recent);
    if (seenSearches.has(normalized)) continue;
    if (q.length > 0 && !startsWith(normalized, q)) continue;
    const rank: MatchRank =
      q.length > 0 && normalized === q ? 'exact' : 'prefix';
    push({
      id: `search:${normalized}`,
      kind: 'search',
      query: recent,
      title: recent,
      source: 'recent-searches',
      rank,
    });
    seenSearches.add(normalized);
  }

  return suggestions;
}

/**
 * Collect live data for suggestion building. History is only queried when the
 * user has granted the history permission (the caller decides, and only asks
 * for permission when the user explicitly enables history suggestions).
 */
export async function collectSuggestionData(
  includeHistory: boolean
): Promise<{
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  tabs: TabItem[];
}> {
  const [bookmarks, history, tabs] = await Promise.all([
    getBookmarks(),
    includeHistory ? getRecentHistory('', 20) : Promise.resolve([]),
    listTabs(),
  ]);
  return { bookmarks, history, tabs };
}
