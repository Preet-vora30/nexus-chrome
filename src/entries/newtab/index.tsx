import * as React from 'react';
import { Search } from 'lucide-react';
import { Shell } from '@/components/layout/shell';
import { Header } from '@/components/layout/header';
import { SmartSearch } from '@/components/search/smart-search';
import { ShortcutGrid } from '@/components/shortcuts/shortcut-grid';
import { CommandPalette } from '@/components/shortcuts/command-palette';
import type { CommandPaletteApi } from '@/components/shortcuts/command-palette';
import { WidgetClock } from '@/components/widgets/widget-clock';
import { WidgetNotes } from '@/components/widgets/widget-notes';
import { WidgetTodos } from '@/components/widgets/widget-todos';
import { WidgetTabs } from '@/components/widgets/widget-tabs';
import { WidgetBookmarks } from '@/components/widgets/widget-bookmarks';
import { WidgetFocus } from '@/components/widgets/widget-focus';
import { WidgetReading } from '@/components/widgets/widget-reading';
import { WidgetSummary } from '@/components/widgets/widget-summary';
import { WidgetGrid } from '@/components/widgets/widget-grid';
import { CustomizationPanel } from '@/components/customization/customization-panel';
import { useTheme } from '@/hooks/useTheme';
import { useStorage } from '@/hooks/useStorage';
import { toast } from '@/components/ui/notification';
import { listTabs, switchToTab, closeTab, openTab } from '@/lib/tabs';
import { getBookmarks, openBookmark } from '@/lib/bookmarks';
import { requestPermission } from '@/lib/permissions';
import { createNote, listNotes, removeNote, togglePin, updateNote } from '@/lib/notes';
import type { NoteDraft } from '@/components/widgets/widget-notes';
import {
  createTask,
  listTasks,
  removeTask,
  setTaskDone,
  updateTask,
} from '@/lib/todos';
import type { TaskDraft } from '@/lib/todos';
import {
  listReading,
  removeReading,
  saveCurrentTab,
  setReadingRead,
} from '@/lib/reading-list';
import type { ReadingDraft } from '@/lib/reading-list';
import { getFocusSessionsCompleted, addFocusSession } from '@/lib/focus-sessions';
import { requestHistoryPermission } from '@/lib/history';
import {
  clearRecentSearches,
  addRecentSearch,
  listRecentSearches,
  removeRecentSearch,
} from '@/lib/recent-searches';
import {
  DEFAULT_SETTINGS,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_WIDGET_SETTINGS,
  sanitizeQuickLinks,
  sanitizeSettings,
} from '@/lib/validation';
import type {
  DashboardSettings,
  FocusSettings,
  NoteItem,
  QuickLink,
  TabItem,
  BookmarkItem,
  TodoItem,
} from '@/types';
import '@/design/globals.css';
import '@/design/tokens.css';

const SEARCH_ENGINES: { id: string; name: string; url: string; icon: string }[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', icon: 'G' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', icon: 'B' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', icon: 'D' },
];

const WIDGET_TITLES: Record<string, string> = {
  clock: 'Clock & date',
  notes: 'Notes',
  todos: 'To-do',
  tabs: 'Open tabs',
  bookmarks: 'Bookmarks',
  focus: 'Focus timer',
  reading: 'Reading list',
  summary: 'Productivity',
};

function isUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed);
}

function navigateTo(url: string): void {
  window.location.href = url;
}

function searchWith(engine: { url: string }, query: string): void {
  navigateTo(engine.url.replace('{query}', encodeURIComponent(query)));
}

function urlHostname(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

interface DashboardProps {
  settings: DashboardSettings;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  onCloseSuggestions: () => void;
  recentSearches: string[];
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  includeHistory: boolean;
  quickLinks: QuickLink[];
  onQuickLinksChange: (links: QuickLink[]) => void;
  onOpenLink: (link: QuickLink) => void;
  engineIndex: number;
  onEngineChange: (index: number) => void;
  tabs: TabItem[];
  tabsLoading: boolean;
  tabsError: string | null;
  onSwitchTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onRefreshTabs: () => void;
  bookmarks: BookmarkItem[];
  bookmarksLoading: boolean;
  bookmarksError: string | null;
  onOpenBookmark: (url: string) => void;
  onRefreshBookmarks: () => void;
  widgetNotes: {
    visible: boolean;
    notes: NoteItem[];
    onCreate: (draft: NoteDraft) => Promise<void>;
    onUpdate: (id: string, draft: NoteDraft) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onTogglePin: (id: string) => Promise<void>;
  };
  widgetTodos: {
    visible: boolean;
    tasks: TodoItem[];
    onCreate: (draft: TaskDraft) => Promise<void>;
    onComplete: (id: string, done: boolean) => Promise<void>;
    onUpdate: (
      id: string,
      patch: { priority?: TodoItem['priority']; dueDate?: string; category?: string }
    ) => void;
    onDelete: (id: string) => Promise<void>;
  };
  widgetReading: {
    visible: boolean;
    items: import('@/types').ReadingItem[];
    loading: boolean;
    error: string | null;
    onSaveCurrent: () => void;
    onSaveUrl: (url: string) => void;
    onOpen: (item: import('@/types').ReadingItem) => void;
    onToggleRead: (id: string, read: boolean) => void;
    onDelete: (id: string) => void;
  };
  widgetFocus: {
    visible: boolean;
    settings: FocusSettings;
    sessionsCompleted: number;
    onToggleNotifications: (enabled: boolean) => void;
    onSessionCompleted: () => void;
  };
  widgetSummary: {
    visible: boolean;
    notesCount: number;
    tasks: TodoItem[];
    focusSessionsCompleted: number;
  };
  widgetGrid: {
    widgets: { id: string; title: string; visible: boolean }[];
    onToggle: (id: string) => void;
    onReorder: (ids: string[]) => void;
    onResetLayout: () => void;
  }
}
function Dashboard({
  settings,
  query,
  onQueryChange,
  onSubmitSearch,
  onCloseSuggestions,
  recentSearches,
  onRemoveRecentSearch,
  onClearRecentSearches,
  includeHistory,
  quickLinks,
  onQuickLinksChange,
  onOpenLink,
  engineIndex,
  onEngineChange,
  tabs,
  tabsLoading,
  tabsError,
  onSwitchTab,
  onCloseTab,
  onRefreshTabs,
  bookmarks,
  bookmarksLoading,
  bookmarksError,
  onOpenBookmark,
  onRefreshBookmarks,
  widgetNotes,
  widgetTodos,
  widgetReading,
  widgetFocus,
  widgetSummary,
  widgetGrid,
}: DashboardProps) {
  const engine = SEARCH_ENGINES[engineIndex] ?? SEARCH_ENGINES[0];

  return (
    <main className="flex-1 overflow-y-auto">
      <div className={densityPadding(settings.density)}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative w-full max-w-3xl">
            <SmartSearch
              value={query}
              onChange={(value) => {
                onQueryChange(value);
              }}
              onSubmit={onSubmitSearch}
              onClose={onCloseSuggestions}
              includeHistory={includeHistory}
              recentSearches={recentSearches}
              onRemoveRecentSearch={onRemoveRecentSearch}
              onClearRecentSearches={onClearRecentSearches}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:text-foreground"
              onClick={() => onEngineChange((engineIndex + 1) % SEARCH_ENGINES.length)}
            >
              {engine.name}
            </span>
            <span className="h-3.5 w-px bg-muted" />
            <span className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                <kbd className="rounded border border-input px-1">/</kbd> search ·{' '}
                <kbd className="rounded border border-input px-1">Ctrl</kbd> +
                <kbd className="rounded border border-input px-1">K</kbd>{' '}
                palette
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <ShortcutGrid
              links={quickLinks}
              onOpen={onOpenLink}
              onAdd={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onReorder={onQuickLinksChange}
              editable={false}
            />
            <WidgetNotes {...widgetNotes} />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <WidgetClock
              visible={settings.widgets['clock'] ?? true}
              format={settings.clockFormat}
            />
            <WidgetTodos {...widgetTodos} />
            <WidgetTabs
              visible={settings.widgets['tabs'] ?? true}
              tabs={tabs}
              loading={tabsLoading}
              error={tabsError}
              onSwitch={onSwitchTab}
              onClose={onCloseTab}
              onRefresh={onRefreshTabs}
            />
            <WidgetBookmarks
              visible={settings.widgets['bookmarks'] ?? true}
              bookmarks={bookmarks}
              loading={bookmarksLoading}
              error={bookmarksError}
              onOpen={onOpenBookmark}
              onRefresh={onRefreshBookmarks}
            />
            <WidgetFocus {...widgetFocus} />
            <WidgetReading {...widgetReading} />
            <WidgetSummary {...widgetSummary} />
          </div>
        </div>

        <div className="mt-6">
          <WidgetGrid
            widgets={widgetGrid.widgets}
            onToggle={widgetGrid.onToggle}
            onReorder={widgetGrid.onReorder}
            onResetLayout={widgetGrid.onResetLayout}
          />
        </div>
      </div>
    </main>
  );
}

function densityPadding(density: string): string {
  switch (density) {
    case 'compact':
      return 'p-2 sm:p-3';
    case 'spacious':
      return 'p-6 sm:p-8';
    default:
      return 'p-4 sm:p-6';
  }
}

export default function App() {
  const { mounted, toggle: toggleTheme } = useTheme();
  const [storedSettings, setStoredSettings] = useStorage<DashboardSettings>(
    'nexus_settings',
    DEFAULT_SETTINGS
  );
  const settings = React.useMemo(
    () => sanitizeSettings(storedSettings),
    [storedSettings]
  );

  const updateSettings = (next: Partial<DashboardSettings>) => {
    setStoredSettings(sanitizeSettings({ ...settings, ...next }));
    toast({ title: 'Settings saved' });
  };

  // History-based suggestions are opt-in: the permission is requested only
  // when the user explicitly enables them.
  React.useEffect(() => {
    if (!settings.historySuggestions) return;
    let cancelled = false;
    void requestHistoryPermission().then((granted) => {
      if (cancelled) return;
      if (!granted) {
        setStoredSettings((current) =>
          sanitizeSettings({
            ...current,
            historySuggestions: false,
          })
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [settings.historySuggestions, setStoredSettings]);

  const [quickLinks, setQuickLinks] = useStorage<QuickLink[]>(
    'nexus_quick_links',
    []
  );
  const [query, setQuery] = React.useState('');
  const [engineIndex, setEngineIndex] = React.useState(0);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void listRecentSearches().then((searches) => {
      if (!cancelled) setRecentSearches(searches);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmitSearch = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    void addRecentSearch(trimmed);
    void listRecentSearches().then((searches) => setRecentSearches(searches));
    if (isUrl(trimmed)) {
      navigateTo(/^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed);
    } else {
      const engine = SEARCH_ENGINES[engineIndex] ?? SEARCH_ENGINES[0];
      searchWith(engine, trimmed);
    }
    setQuery('');
  };
  const handleRemoveRecent = (search: string) => {
    void removeRecentSearch(search);
    void listRecentSearches().then((searches) => setRecentSearches(searches));
  };

  const handleClearRecent = () => {
    void clearRecentSearches();
    setRecentSearches([]);
  };

  // ------------------------------------------------------------------ notes
  const [notes, setNotes] = React.useState<NoteItem[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    void listNotes().then((items) => {
      if (!cancelled) setNotes(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateNote = async (draft: NoteDraft) => {
    const note = await createNote(draft);
    setNotes((prev) => [note, ...prev]);
    toast({ title: 'Note created' });
  };

  const handleUpdateNote = async (id: string, draft: NoteDraft) => {
    await updateNote(id, draft);
    const items = await listNotes();
    setNotes(items);
  };

  const handleDeleteNote = async (id: string) => {
    await removeNote(id);
    setNotes((prev) => prev.filter((note) => note.id !== id));
    toast({ title: 'Note deleted', variant: 'destructive' });
  };

  const handleTogglePin = async (id: string) => {
    await togglePin(id);
    const items = await listNotes();
    setNotes(items);
  };

  // ------------------------------------------------------------------- tasks
  const [todos, setTodos] = React.useState<TodoItem[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    void listTasks().then((tasks) => {
      if (!cancelled) setTodos(tasks);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateTask = async (draft: TaskDraft) => {
    const task = await createTask(draft);
    setTodos((prev) => [task, ...prev]);
    toast({ title: 'Task created' });
  };

  const handleCompleteTask = async (id: string, done: boolean) => {
    await setTaskDone(id, done);
    const tasks = await listTasks();
    setTodos(tasks);
  };

  const handleUpdateTask = (
    id: string,
    patch: { priority?: TodoItem['priority']; dueDate?: string; category?: string }
  ) => {
    void updateTask(id, patch).then(() => {
      void listTasks().then((tasks) => setTodos(tasks));
    });
  };

  const handleDeleteTask = async (id: string) => {
    await removeTask(id);
    setTodos((prev) => prev.filter((task) => task.id !== id));
    toast({ title: 'Task deleted', variant: 'destructive' });
  };

  // --------------------------------------------------------------- reading list
  const [readingItems, setReadingItems] = React.useState<
    import('@/types').ReadingItem[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    void listReading().then((items) => {
      if (!cancelled) setReadingItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshReadingList = async () => {
    const items = await listReading();
    setReadingItems(items);
  };

  const handleSaveCurrentTab = async () => {
    const current = await findCurrentTab();
    if (!current) return;
    const draft: ReadingDraft = {
      title: current.title || 'Current page',
      url: current.url,
      faviconUrl: current.favIconUrl,
    };
    const item = await saveCurrentTab(draft);
    await refreshReadingList();
    toast({ title: `Saved “${item.title}” to the reading list` });
  };

  const handleSaveUrl = async (url: string) => {
    const draft: ReadingDraft = {
      title: urlHostname(url),
      url,
    };
    const item = await saveCurrentTab(draft);
    await refreshReadingList();
    toast({ title: `Saved “${item.title}” to the reading list` });
  };

  const handleToggleRead = async (id: string, read: boolean) => {
    await setReadingRead(id, read);
    await refreshReadingList();
  };

  const handleDeleteReading = async (id: string) => {
    await removeReading(id);
    setReadingItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: 'Removed from the reading list', variant: 'destructive' });
  };

  // -------------------------------------------------------------- focus stats
  const [focusSessions, setFocusSessions] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    void getFocusSessionsCompleted().then((count) => {
      if (!cancelled) setFocusSessions(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordFocusSession = async () => {
    await addFocusSession();
    const count = await getFocusSessionsCompleted();
    setFocusSessions(count);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSettings({
        focus: { ...settings.focus, notificationsEnabled: false },
      });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSettings({
          focus: { ...settings.focus, notificationsEnabled: true },
        });
      }
    } catch {
      // Notifications unsupported — keep disabled.
    }
  };

  // --------------------------------------------------- tabs, bookmarks & palette
  const [tabs, setTabs] = React.useState<TabItem[]>([]);
  const [tabsLoading, setTabsLoading] = React.useState(false);
  const [tabsError, setTabsError] = React.useState<string | null>(null);
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = React.useState(false);
  const [bookmarksError, setBookmarksError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setTabsLoading(true);
      try {
        const granted = await requestPermission('tabs');
        if (!granted) {
          setTabsError('Tab access permission not granted.');
          setTabsLoading(false);
          return;
        }
        const data = await listTabs();
        if (!cancelled) setTabs(data);
      } catch {
        if (!cancelled) setTabsError('Failed to load tabs.');
      } finally {
        if (!cancelled) setTabsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setBookmarksLoading(true);
      try {
        const granted = await requestPermission('bookmarks');
        if (!granted) {
          setBookmarksError('Bookmarks permission not granted.');
          setBookmarksLoading(false);
          return;
        }
        const data = await getBookmarks();
        if (!cancelled) setBookmarks(data);
      } catch {
        if (!cancelled) setBookmarksError('Failed to load bookmarks.');
      } finally {
        if (!cancelled) setBookmarksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------- command palette
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [paletteQuery, setPaletteQuery] = React.useState('');
  const [customizeOpen, setCustomizeOpen] = React.useState(false);

  const handleCreateNoteNow = async () => {
    await handleCreateNote({ title: 'New note', content: '' });
  };

  const handleCreateTaskNow = async () => {
    await handleCreateTask({ title: 'New task', priority: 'none' });
  };

  const resetDashboardLayout = async () => {
    setStoredSettings(
      sanitizeSettings({
        ...settings,
        widgets: { ...DEFAULT_WIDGET_SETTINGS },
        widgetOrder: [...DEFAULT_WIDGET_ORDER],
      })
    );
    toast({ title: 'Dashboard layout restored' });
  };

  const commandApi: CommandPaletteApi = {
    query: paletteQuery,
    openTab: (url) => openTab(url),
    switchToTab: (tabId) => switchToTab(tabId),
    openChromePage: async (url) => {
      await openTab(url);
    },
    toggleTheme: () =>
      Promise.resolve(toggleTheme()),
    createNote: () => handleCreateNoteNow(),
    createTask: () => handleCreateTaskNow(),
    resetDashboardLayout: async () => {
      await resetDashboardLayout();
    },
  };

  const handleRunCommand = async (run: (api: CommandPaletteApi) => Promise<void>) => {
    await run(commandApi);
  };

  // --------------------------------------------------------------- keyboard
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!mounted) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target?.isContentEditable ?? false);
      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setPaletteOpen((open) => !open);
        }
        return;
      }
      if (editable) return;
      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
      } else if (event.key === 'n' && settings.shortcuts.createNote) {
        event.preventDefault();
        void handleCreateNoteNow();
      } else if (event.key === 't' && settings.shortcuts.createTask) {
        event.preventDefault();
        void handleCreateTaskNow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, settings.shortcuts]);

  // ---------------------------------------------------------------- tab lookup
  const findCurrentTab = async () => {
    const all = await listTabs();
    return all.find((tab) => tab.active) ?? all[0];
  };
  // ------------------------------------------------------------------- widgets
  const visibleWidgets = (id: string): boolean =>
    settings.widgets[id] ?? true;

  const widgetItems = DEFAULT_WIDGET_ORDER.map((id) => ({
    id,
    title: WIDGET_TITLES[id] ?? id,
    visible: visibleWidgets(id),
  }));

  if (!mounted) return null;

  return (
    <Shell className="bg-background">
      <Header
        onSettings={() => setCustomizeOpen(true)}
        onCustomize={() => setCustomizeOpen(true)}
      />

      <Dashboard
        settings={settings}
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
        }}
        onSubmitSearch={handleSubmitSearch}
        onCloseSuggestions={() => {}}
        recentSearches={recentSearches}
        onRemoveRecentSearch={handleRemoveRecent}
        onClearRecentSearches={handleClearRecent}
        includeHistory={settings.historySuggestions}
        quickLinks={quickLinks}
        onQuickLinksChange={(links) =>
          setQuickLinks(sanitizeQuickLinks(links))
        }
        onOpenLink={(link) => navigateTo(link.url)}
        engineIndex={engineIndex}
        onEngineChange={(index) => setEngineIndex(index)}
        tabs={tabs}
        tabsLoading={tabsLoading}
        tabsError={tabsError}
        onSwitchTab={(tabId) => void switchToTab(tabId)}
        onCloseTab={(tabId) => {
          void closeTab(tabId);
          setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
        }}
        onRefreshTabs={() => {
          setTabsLoading(true);
          void listTabs().then((data) => {
            setTabs(data);
            setTabsLoading(false);
          });
        }}
        bookmarks={bookmarks}
        bookmarksLoading={bookmarksLoading}
        bookmarksError={bookmarksError}
        onOpenBookmark={(url) => void openBookmark(url)}
        onRefreshBookmarks={() => {
          setBookmarksLoading(true);
          void getBookmarks().then((data) => {
            setBookmarks(data);
            setBookmarksLoading(false);
          });
        }}
        widgetNotes={{
          visible: visibleWidgets('notes'),
          notes,
          onCreate: handleCreateNote,
          onUpdate: handleUpdateNote,
          onDelete: handleDeleteNote,
          onTogglePin: handleTogglePin,
        }}
        widgetTodos={{
          visible: visibleWidgets('todos'),
          tasks: todos,
          onCreate: handleCreateTask,
          onComplete: handleCompleteTask,
          onUpdate: handleUpdateTask,
          onDelete: handleDeleteTask,
        }}
        widgetReading={{
          visible: visibleWidgets('reading'),
          items: readingItems,
          loading: false,
          error: null,
          onSaveCurrent: () => void handleSaveCurrentTab(),
          onSaveUrl: (url) => void handleSaveUrl(url),
          onOpen: (item) => void openTab(item.url),
          onToggleRead: (id, read) => void handleToggleRead(id, read),
          onDelete: (id) => void handleDeleteReading(id),
        }}
        widgetFocus={{
          visible: visibleWidgets('focus'),
          settings: settings.focus,
          sessionsCompleted: focusSessions,
          onToggleNotifications: (enabled) =>
            void handleToggleNotifications(enabled),
          onSessionCompleted: () => {
            void recordFocusSession();
          },
        }}
        widgetSummary={{
          visible: visibleWidgets('summary'),
          notesCount: notes.length,
          tasks: todos,
          focusSessionsCompleted: focusSessions,
        }}
        widgetGrid={{
          widgets: widgetItems,
          onToggle: (id) =>
            updateSettings({
              widgets: {
                ...settings.widgets,
                [id]: !visibleWidgets(id),
              },
            }),
          onReorder: (ids) => updateSettings({ widgetOrder: ids }),
          onResetLayout: () => void resetDashboardLayout(),
        }}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        query={paletteQuery}
        onQueryChange={(value) => setPaletteQuery(value)}
        onRun={handleRunCommand}
      />
      <CustomizationPanel
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        settings={settings}
        onSave={(next) => updateSettings(next)}
      />
    </Shell>
  );
}
