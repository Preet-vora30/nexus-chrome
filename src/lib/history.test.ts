import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getRecentHistory,
  hasHistoryPermission,
  requestHistoryPermission,
} from './history';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  localStorage.clear();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

function installHistoryApi(granted: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = {
    history: {
      search: async () => [
        {
          id: 1,
          title: 'Example',
          url: 'https://example.com',
          lastVisitTime: 100,
        },
      ],
    },
    permissions: {
      contains: async () => granted,
      request: async () => granted,
    },
  };
}

describe('history permission gating', () => {
  it('reports no permission when the history API is missing', async () => {
    expect(await hasHistoryPermission()).toBe(false);
    expect(await requestHistoryPermission()).toBe(false);
    expect(await getRecentHistory('')).toEqual([]);
  });

  it('refuses to request history when it is missing', async () => {
    installHistoryApi(false);
    expect(await hasHistoryPermission()).toBe(false);
    expect(await requestHistoryPermission()).toBe(false);
  });

  it('grants history only after the user approves it', async () => {
    installHistoryApi(true);
    expect(await hasHistoryPermission()).toBe(true);
    const pages = await getRecentHistory('');
    expect(pages).toHaveLength(1);
    expect(pages[0].url).toBe('https://example.com');
  });
});
