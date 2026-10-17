import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from '@/components/layout/shell';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorage } from '@/hooks/useStorage';
import { toast } from '@/components/ui/notification';
import { Switch } from '@/components/ui/switch';
import { ShortcutGrid } from '@/components/shortcuts/shortcut-grid';
import { ShortcutEditor } from '@/components/shortcuts/shortcut-editor';
import { WidgetGrid } from '@/components/widgets/widget-grid';
import {
  DEFAULT_SETTINGS,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_WIDGET_SETTINGS,
} from '@/lib/validation';
import { type DashboardSettings, type QuickLink, type ThemeMode } from '@/types';
import '@/design/globals.css';
import '@/design/tokens.css';

const WIDGET_TITLES: Record<string, string> = {
  clock: 'Clock & date',
  notes: 'Notes',
  todos: 'To-do',
  tabs: 'Open tabs',
  bookmarks: 'Bookmarks',
  focus: 'Focus timer',
};

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: '1', title: 'Google', url: 'https://google.com', icon: 'G' },
  { id: '2', title: 'GitHub', url: 'https://github.com', icon: 'Octocat' },
  { id: '3', title: 'YouTube', url: 'https://youtube.com', icon: 'YT' },
  { id: '4', title: 'Gmail', url: 'https://gmail.com', icon: 'M' },
];

function modeLabel(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function App() {
  const [settings, setSettings] = useStorage<DashboardSettings>(
    'nexus_settings',
    DEFAULT_SETTINGS
  );
  const [quickLinks, setQuickLinks] = useStorage<QuickLink[]>(
    'nexus_quick_links',
    DEFAULT_QUICK_LINKS
  );

  const [showEditor, setShowEditor] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<QuickLink | undefined>(
    undefined
  );

  const handleAddLink = () => {
    setEditingLink(undefined);
    setShowEditor(true);
  };
  const handleEditLink = (link: QuickLink) => {
    setEditingLink(link);
    setShowEditor(true);
  };
  const handleDeleteLink = (link: QuickLink) => {
    if (!window.confirm(`Remove "${link.title}"?`)) return;
    setQuickLinks(quickLinks.filter((l) => l.id !== link.id));
    toast({ title: 'Link removed', variant: 'destructive' });
  };
  const handleSaveLink = (data: Omit<QuickLink, 'id'>) => {
    if (editingLink) {
      setQuickLinks(
        quickLinks.map((l) =>
          l.id === editingLink.id ? { ...l, ...data } : l
        )
      );
      toast({ title: 'Shortcut updated' });
    } else {
      setQuickLinks([...quickLinks, { ...data, id: String(Date.now()) }]);
      toast({ title: 'Shortcut added' });
    }
    setShowEditor(false);
    setEditingLink(undefined);
  };
  const handleReorder = (next: QuickLink[]) => {
    setQuickLinks(next);
    toast({ title: 'Order saved' });
  };

  const handleToggleWidget = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      widgets: { ...prev.widgets, [id]: !prev.widgets[id] },
    }));
  };

  const handleReorderWidgets = (next: string[]) => {
    setSettings((prev) => ({ ...prev, widgetOrder: next }));
  };

  const handleResetLayout = () => {
    setSettings((prev) => ({
      ...prev,
      widgets: { ...DEFAULT_WIDGET_SETTINGS },
      widgetOrder: [...DEFAULT_WIDGET_ORDER],
    }));
  };

  return (
    <Shell>
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Nexus Browser OS preferences
          </p>
        </div>

        {/* Appearance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSettings({ ...settings, theme: t as ThemeMode });
                    void (async () => {
                      const { storage } = await import('@/lib/storage');
                      await storage.set('theme', t);
                    })();
                  }}
                  className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${
                    settings.theme === t
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {modeLabel(t)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Accent color</span>
              {['hsl(217 91% 60%)', 'hsl(265 85% 60%)', 'hsl(188 92% 58%)'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSettings({ ...settings, accentColor: color });
                  }}
                  className={`h-8 w-8 rounded-full border transition-all ${
                    settings.accentColor === color
                      ? 'ring-2 ring-ring border-transparent'
                      : 'border-input hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Behavior</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Clock format</span>
              <div className="flex gap-1">
                {(['12', '24'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setSettings({ ...settings, clockFormat: fmt });
                    }}
                    className={`h-8 w-8 rounded-md border text-xs font-medium transition-colors ${
                      settings.clockFormat === fmt
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Animations</span>
              <Switch
                checked={settings.animationsEnabled}
                onChange={(event) => {
                  setSettings({ ...settings, animationsEnabled: event.target.checked });
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Dashboard density</span>
              <div className="flex gap-1">
                {(['comfortable', 'compact', 'spacious'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSettings({ ...settings, density: d });
                    }}
                    className={`h-8 w-8 rounded-md border text-xs font-medium transition-colors ${
                      settings.density === d
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widgets */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dashboard widgets</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <WidgetGrid
              widgets={DEFAULT_WIDGET_ORDER.map((id) => ({
                id,
                title: WIDGET_TITLES[id] ?? `Widget ${id}`,
                visible: settings.widgets[id] ?? true,
              }))}
              onToggle={handleToggleWidget}
              onReorder={handleReorderWidgets}
              onResetLayout={handleResetLayout}
            />
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Quick links</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleAddLink}>
                Add link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ShortcutGrid
              links={quickLinks}
              onOpen={() => {}}
              onAdd={handleAddLink}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
              onReorder={handleReorder}
              editable={true}
            />
          </CardContent>
        </Card>

        <ShortcutEditor
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveLink}
          initial={editingLink}
          editing={!!editingLink}
        />
      </div>
    </Shell>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
