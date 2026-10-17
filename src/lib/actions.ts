/**
 * Browser quick actions.
 *
 * Uses supported Chrome URLs and APIs only. No protected toolbar or
 * chrome:// modification is attempted.
 */

export type QuickAction = {
  id: string;
  label: string;
  icon: string;
  url?: string; // chrome:// URL to open in a new tab
  action?: () => Promise<void>; // or a Chrome API action
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-tab',
    label: 'New tab',
    icon: 'Plus',
    action: async () => {
      const { openTab } = await import('./tabs');
      await openTab(chrome.extension.getURL('newtab.html'));
    },
  },
  {
    id: 'new-window',
    label: 'New window',
    icon: 'Copy',
    action: async () => {
      await chrome.windows.create?.({ focused: true });
    },
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: 'Download',
    url: 'chrome://downloads',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'Clock',
    url: 'chrome://history',
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: 'BookOpen',
    url: 'chrome://bookmarks',
  },
  {
    id: 'settings',
    label: 'Chrome settings',
    icon: 'Settings',
    url: 'chrome://settings',
  },
  {
    id: 'extensions',
    label: 'Extensions',
    icon: 'Puzzle',
    url: 'chrome://extensions',
  },
];

export async function runQuickAction(id: string): Promise<void> {
  const action = QUICK_ACTIONS.find((a) => a.id === id);
  if (!action) return;
  if (action.action) {
    await action.action();
    return;
  }
  if (action.url) {
    const { openTab } = await import('./tabs');
    await openTab(action.url);
  }
}
