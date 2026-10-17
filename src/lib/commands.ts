/**
 * Command palette actions.
 *
 * Every command here performs a real action against the extension or the
 * browser. Commands that need a parameter (such as a tab to focus) receive
 * it from the typed query and the matching open tabs, reusing the same
 * suggestion logic as the smart search bar.
 */

import { listTabs, openTab } from './tabs';


export interface CommandContext {
  /** Text typed into the command palette. */
  query: string;
  openTab: (url: string) => Promise<void>;
  /** Focus an existing tab. */
  switchToTab: (tabId: number) => Promise<void>;
  openChromePage: (url: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  createNote: () => Promise<void>;
  createTask: () => Promise<void>;
  resetDashboardLayout: () => Promise<void>;
}

export interface Command {
  id: string;
  label: string;
  description: string;
  /** Lucide icon name resolved by the palette UI. */
  icon: string;
  keywords: string[];
  run: (context: CommandContext) => Promise<void>;
}

export const COMMANDS: Command[] = [
  {
    id: 'search-the-web',
    label: 'Search the web',
    description: 'Run the typed text in the default search engine.',
    icon: 'Search',
    keywords: ['search', 'google', 'engine'],
    run: async ({ query }) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
      await openTab(url);
    },
  },
  {
    id: 'open-downloads',
    label: 'Open downloads',
    description: 'Show the downloads page.',
    icon: 'Download',
    keywords: ['downloads', 'files'],
    run: async ({ openChromePage }) => {
      await openChromePage('chrome://downloads');
    },
  },
  {
    id: 'open-history',
    label: 'Open history',
    description: 'Show the browsing history page.',
    icon: 'History',
    keywords: ['history', 'past'],
    run: async ({ openChromePage }) => {
      await openChromePage('chrome://history');
    },
  },
  {
    id: 'open-bookmarks',
    label: 'Open bookmarks',
    description: 'Show the bookmarks manager.',
    icon: 'Bookmarks',
    keywords: ['bookmarks', 'saved'],
    run: async ({ openChromePage }) => {
      await openChromePage('chrome://bookmarks');
    },
  },
  {
    id: 'create-note',
    label: 'Create a note',
    description: 'Add a new note to the reading list widget.',
    icon: 'Note',
    keywords: ['note', 'writing'],
    run: async ({ createNote }) => {
      await createNote();
    },
  },
  {
    id: 'create-task',
    label: 'Create a task',
    description: 'Add a new task to the to-do widget.',
    icon: 'ListTodo',
    keywords: ['task', 'todo'],
    run: async ({ createTask }) => {
      await createTask();
    },
  },
  {
    id: 'toggle-theme',
    label: 'Toggle theme',
    description: 'Switch between light and dark appearance.',
    icon: 'Theme',
    keywords: ['theme', 'dark', 'light'],
    run: async ({ toggleTheme }) => {
      await toggleTheme();
    },
  },
  {
    id: 'open-settings',
    label: 'Open settings',
    description: 'Open the Nexus settings page.',
    icon: 'Settings',
    keywords: ['settings', 'preferences'],
    run: async ({ openChromePage }) => {
      // The settings entry page is opened through the options page.
      await openChromePage(chrome.runtime.getURL('settings.html'));
    },
  },
  {
    id: 'reset-dashboard-layout',
    label: 'Reset dashboard layout',
    description: 'Restore the default widget order and visibility.',
    icon: 'Reset',
    keywords: ['reset', 'layout', 'widgets'],
    run: async ({ resetDashboardLayout }) => {
      await resetDashboardLayout();
    },
  },
];

/** Open-tab suggestions used by the command palette. */
export async function buildTabSuggestions(
  query: string
): Promise<Array<{ tabId: number; title: string; url: string }>> {
  const tabs = await listTabs();
  const q = query.trim().toLowerCase();
  const matches = tabs
    .filter((tab) => {
      const title = (tab.title ?? '').toLowerCase();
      return title.includes(q) || tab.url.toLowerCase().includes(q);
    })
    .slice(0, 8);
  return matches.map((tab) => ({
    tabId: tab.id,
    title: tab.title || tab.url,
    url: tab.url,
  }));
}
