/**
 * Storage abstraction over Chrome's extension storage APIs.
 *
 * - `chrome.storage.local` is used for all user data (notes, tasks, reading
 *   list, dashboard layout, recent searches, …) so it is fast and never
 *   charged against the user's sync quota.
 * - `chrome.storage.sync` is only used for the theme preference, which was
 *   already persisted there before this module existed. Nothing claims to
 *   synchronize notes or tasks across devices.
 *
 * When the Chrome extension APIs are unavailable (Vitest/jsdom tests, or a
 * page served by the Vite dev server), the module transparently falls back
 * to `localStorage` so business logic stays testable without mocking.
 */

type StorageArea = {
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

function parse<T>(raw: string | null, defaultValue: T): T {
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function chromeStorageArea(area: 'local' | 'sync'): StorageArea | undefined {
  if (
    typeof chrome === 'undefined' ||
    !chrome.storage ||
    !chrome.storage[area]
  ) {
    return undefined;
  }
  return chrome.storage[area] as StorageArea;
}

export const storage = {
  /**
   * Read a value from `chrome.storage.local` (or localStorage in tests).
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const area = chromeStorageArea('local');
    if (area) {
      const result = await area.get(key);
      return (result[key] ?? defaultValue) as T;
    }
    const raw = localStorage.getItem(key);
    return parse<T>(raw, defaultValue);
  },

  /**
   * Write a value to `chrome.storage.local`.
   */
  async set<T>(key: string, value: T): Promise<void> {
    const area = chromeStorageArea('local');
    if (area) {
      await area.set({ [key]: value });
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Delete a single key.
   */
  async remove(key: string): Promise<void> {
    const area = chromeStorageArea('local');
    if (area) {
      await area.remove(key);
      return;
    }
    localStorage.removeItem(key);
  },
};

/**
 * Theme preference lives in `chrome.storage.sync` for backwards compatibility
 * with settings created by earlier versions of the extension. It is the only
 * value kept in the sync area; everything else uses local storage.
 */
export const themeStorage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const area = chromeStorageArea('sync');
    if (area) {
      const result = await area.get(key);
      return (result[key] ?? defaultValue) as T;
    }
    const raw = localStorage.getItem(key);
    return parse<T>(raw, defaultValue);
  },

  async set<T>(key: string, value: T): Promise<void> {
    const area = chromeStorageArea('sync');
    if (area) {
      await area.set({ [key]: value });
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    const area = chromeStorageArea('sync');
    if (area) {
      await area.remove(key);
      return;
    }
    localStorage.removeItem(key);
  },
};

/**
 * Bumped whenever the shape of stored values changes in a way that requires
 * sanitizing or migrating existing entries. Background startup reads the
 * stored version and migrates (or sanitizes on read) older data.
 */
export const STORAGE_VERSION = 1;

const VERSION_KEY = 'nexus_storage_version';

/**
 * Runs one-time storage migrations. Existing values are never overwritten
 * before validation: every reader sanitizes whatever it loads.
 */
export async function migrateStorage(): Promise<void> {
  try {
    const current = await storage.get<number>(VERSION_KEY, STORAGE_VERSION);
    if (current >= STORAGE_VERSION) return;
    await storage.set(VERSION_KEY, STORAGE_VERSION);
  } catch {
    // Migration is best-effort; per-key sanitizers keep data usable anyway.
  }
}

/**
 * Read the installed storage version. Defaults to 0 when missing so that
 * `migrateStorage` performs the first run.
 */
export async function getStorageVersion(): Promise<number> {
  return storage.get<number>(VERSION_KEY, 0);
}
