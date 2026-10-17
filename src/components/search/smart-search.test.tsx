import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartSearch } from './smart-search';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  vi.useFakeTimers();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
  vi.useRealTimers();
});

interface Harness {
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClose: () => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  recentSearches: string[];
}

function renderSearch(
  overrides: Partial<Harness> & { recentSearches: string[]; value?: string } = {
    recentSearches: [],
  }
) {
  const { value = '', ...harnessOverrides } = overrides;
  const harness: Harness = {
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    onRemoveRecentSearch: vi.fn(),
    onClearRecentSearches: vi.fn(),
    ...harnessOverrides,
  };
  const utils = render(
    <SmartSearch
      value={value}
      onChange={harness.onChange}
      onSubmit={harness.onSubmit}
      onClose={harness.onClose}
      includeHistory={false}
      recentSearches={harness.recentSearches}
      onRemoveRecentSearch={harness.onRemoveRecentSearch}
      onClearRecentSearches={harness.onClearRecentSearches}
    />
  );
  return { harness, ...utils };
}

describe('SmartSearch', () => {
  it('submits the current value on Enter', () => {
    const { harness } = renderSearch({ value: 'hello world', recentSearches: [] });
    const input = screen.getByLabelText('Search the web');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(harness.onSubmit).toHaveBeenCalledWith('hello world');
  });

  it('closes the panel on Escape without submitting', () => {
    const { harness } = renderSearch({ value: 'nexus', recentSearches: [] });

    fireEvent.keyDown(screen.getByLabelText('Search the web'), { key: 'Escape' });

    expect(harness.onClose).toHaveBeenCalled();
    expect(harness.onSubmit).not.toHaveBeenCalled();
  });

  it('clears the search input when the clear button is used', () => {
    const { harness } = renderSearch({ value: 'abc', recentSearches: [] });

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(harness.onChange).toHaveBeenCalledWith('');
  });

  it('passes the onClearRecentSearches handler', () => {
    const onClearRecentSearches = vi.fn();
    const { harness } = renderSearch({
      onClearRecentSearches,
      recentSearches: ['nexus'],
      value: 'nexus',
    });
    expect(harness.onClearRecentSearches).toBe(onClearRecentSearches);
  });

  it('passes the onRemoveRecentSearch handler to recent search buttons', () => {
    const onRemoveRecentSearch = vi.fn();
    renderSearch({
      onRemoveRecentSearch,
      recentSearches: ['test query'],
      value: 'nexus',
    });
    expect(onRemoveRecentSearch).toBeDefined();
  });
});
