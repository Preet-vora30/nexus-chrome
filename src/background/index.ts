/**
 * Nexus Browser OS — Background service worker (Manifest V3).
 *
 * Responsibilities:
 *  - Ensure default storage values exist after install/update/startup.
 *  - Run one-time storage migrations.
 *  - Configure side panel behavior.
 *
 * Chrome APIs used: storage, sidePanel, runtime.
 */

type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'dark';

async function ensureDefaults(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get<{ theme: Theme }>({
      theme: DEFAULT_THEME,
    });
    if (result.theme === undefined) {
      await chrome.storage.sync.set({ theme: DEFAULT_THEME });
    }
  } catch (error) {
    console.error('[Nexus] Failed to initialize storage defaults:', error);
  }
}

import { migrateStorage } from '@/lib/storage';

async function runMigrations(): Promise<void> {
  await migrateStorage();
}

const sidePanel = chrome.sidePanel as {
  setPanelBehavior?: (options: {
    openPanelOnActionClick: boolean;
  }) => Promise<void>;
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    await ensureDefaults();
    await runMigrations();
    try {
      await sidePanel.setPanelBehavior?.({
        openPanelOnActionClick: true,
      });
    } catch {
      // Side Panel API unavailable in this Chrome version — non-fatal.
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await runMigrations();
});

export {};
