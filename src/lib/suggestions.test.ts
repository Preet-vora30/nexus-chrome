import { describe, it, expect } from 'vitest';
import {
  buildSuggestions,
  SOURCE_LABELS,
} from './suggestions';
import type { BookmarkItem } from '@/types';

describe('buildSuggestions', () => {
  const input = {
    query: '',
    recentSearches: [],
    bookmarks: [],
    history: [],
    tabs: [],
  };

  it('returns nothing for an empty query except URL targets', () => {
    const suggestions = buildSuggestions({
      ...input,
      tabs: [
        { id: 1, title: 'Docs', url: 'https://docs.example', active: true, windowId: 1 },
      ],
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe('open');
    expect(suggestions[0].url).toBe('https://docs.example');
  });

  it('ranks exact matches above prefix matches', () => {
    const suggestions = buildSuggestions({
      ...input,
      recentSearches: ['nexus features'],
      query: 'nexus features',
    });
    const exact = suggestions.find((s) => s.query === 'nexus features');
    expect(exact?.rank).toBe('exact');
    expect(exact?.source).toBe('recent-searches');
  });

  it('only suggests recent searches that start with the typed query', () => {
    const suggestions = buildSuggestions({
      ...input,
      recentSearches: ['alpha', 'alphabet'],
      query: 'alphabet',
    });
    const titles = suggestions.map((s) => s.query);
    expect(titles).toContain('alphabet');
    expect(titles).not.toContain('alpha');
  });

  it('prefers open tabs over bookmarks and history for the same URL', () => {
    const url = 'https://shared.example';
    const bookmarks: BookmarkItem[] = [
      { id: 'bm', title: 'Shared', url, parent: '1' },
    ];
    const suggestions = buildSuggestions({
      ...input,
      tabs: [
        {
          id: 7,
          title: 'Shared tab',
          url,
          active: false,
          windowId: 1,
        },
      ],
      bookmarks,
    });

    const target = suggestions.find((s) => s.url === url);
    expect(target?.source).toBe('open-tabs');
  });

  it('does not suggest the same URL twice', () => {
    const url = 'https://shared.example';
    const suggestions = buildSuggestions({
      ...input,
      tabs: [
        { id: 1, title: 'A', url, active: true, windowId: 1 },
        { id: 2, title: 'B', url, active: false, windowId: 1 },
      ],
    });

    const matches = suggestions.filter((s) => s.url === url);
    expect(matches).toHaveLength(1);
  });

  it('labels every source', () => {
    expect(SOURCE_LABELS['recent-searches']).toBe('Recent searches');
    expect(SOURCE_LABELS.bookmarks).toBe('Bookmarks');
    expect(SOURCE_LABELS.history).toBe('History');
    expect(SOURCE_LABELS['open-tabs']).toBe('Open tabs');
  });
});
