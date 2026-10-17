import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from './storage';

const originalChrome = globalThis.chrome;

beforeEach(() => {
  // Force the localStorage fallback path for deterministic tests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = undefined;
  localStorage.clear();
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = originalChrome;
});

describe('storage (localStorage fallback)', () => {
  it('gets and sets values', async () => {
    await storage.set('theme', 'dark');
    expect(await storage.get('theme', 'light')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('"dark"');
  });

  it('returns the default value for missing keys', async () => {
    expect(await storage.get('missing', 'default')).toBe('default');
  });

  it('removes values', async () => {
    await storage.set('key', 'value');
    await storage.remove('key');
    expect(await storage.get('key', 'default')).toBe('default');
  });
});
