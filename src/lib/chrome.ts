/**
 * Thin, typed wrappers over Chrome extension APIs used by Nexus Browser OS.
 *
 * Centralizing Chrome API calls here makes the dependency surface easy to
 * audit and easy to mock in tests. Only minimum permissions are used.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const browser = {
  async getTheme(): Promise<ThemeMode> {
    const result = await chrome.storage.sync.get<{ theme: ThemeMode }>({
      theme: 'dark',
    });
    return result.theme ?? 'dark';
  },

  async setTheme(theme: ThemeMode): Promise<void> {
    await chrome.storage.sync.set({ theme });
  },

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const result = await chrome.storage.sync.get<Record<string, T>>({
      [key]: defaultValue,
    });
    return result[key] ?? defaultValue;
  },

  async setSetting<T>(key: string, value: T): Promise<void> {
    await chrome.storage.sync.set({ [key]: value });
  },

  async openPanel(): Promise<void> {
    await chrome.sidePanel.open?.({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
  },

  async openOptionsPage(): Promise<void> {
    await chrome.runtime.openOptionsPage?.();
  },
};
