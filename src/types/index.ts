export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

/**
 * Which dashboard widgets are visible. Unknown widget ids are ignored by the
 * UI; every known widget must be present before a save is accepted.
 */
export interface DashboardWidgets {
  [widgetId: string]: boolean;
}

/**
 * Global dashboard shortcuts. Every entry is optional so users can disable
 * individual shortcuts without losing the rest.
 */
export interface DashboardShortcuts {
  /** `/` focuses the main search input. */
  focusSearch: boolean;
  /** `Ctrl+K` / `Command+K` opens the command palette. */
  commandPalette: boolean;
  /** `N` creates a new note. */
  createNote: boolean;
  /** `T` creates a new task. */
  createTask: boolean;
}

/**
 * Pomodoro configuration used by the focus timer widget.
 */
export interface FocusSettings {
  focusMinutes: number;
  breakMinutes: number;
  /** Ask for browser notification permission and announce completions. */
  notificationsEnabled: boolean;
}

export interface DashboardSettings {
  theme: ThemeMode;
  accentColor: string;
  backgroundPreset: string;
  clockFormat: '12' | '24';
  density: 'comfortable' | 'compact' | 'spacious';
  animationsEnabled: boolean;
  widgets: DashboardWidgets;
  /** Ids of visible widgets in display order (drag & drop persisted). */
  widgetOrder: string[];
  shortcuts: DashboardShortcuts;
  focus: FocusSettings;
  /** Opt-in: use browsing history for search suggestions. */
  historySuggestions: boolean;
}

export interface SearchEngine {
  id: string;
  name: string;
  url: string; // URL with {query} placeholder
  icon: string;
}

export interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string | null;
  active: boolean;
  windowId: number;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  parent?: string;
  children?: BookmarkItem[];
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitTime: number;
  typedCount?: number;
}

/** A user-created note. */
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TaskPriority = 'none' | 'low' | 'medium' | 'high';

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  doneAt?: number;
  priority: TaskPriority;
  /** ISO date string (yyyy-mm-dd) or undefined when no due date is set. */
  dueDate?: string;
  /** Free-form category label. */
  category?: string;
  createdAt: number;
}

export interface ReadingItem {
  id: string;
  title: string;
  url: string;
  savedAt: number;
  read: boolean;
  faviconUrl?: string | null;
}
