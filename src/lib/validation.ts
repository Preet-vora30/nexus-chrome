/**
 * Validation and sanitization for persisted dashboard settings.
 *
 * Every value read from storage passes through these functions so that
 * corrupted or hand-edited entries never break the dashboard. Missing or
 * invalid fields fall back to the defaults of the current version, which
 * keeps existing user configuration intact across upgrades.
 */

import type {
  DashboardSettings,
  DashboardShortcuts,
  DashboardWidgets,
  FocusSettings,
  QuickLink,
} from '@/types';

export const DEFAULT_WIDGET_IDS = [
  'clock',
  'notes',
  'todos',
  'tabs',
  'bookmarks',
  'focus',
  'reading',
  'summary',
] as const;

export const DEFAULT_WIDGET_ORDER: string[] = [...DEFAULT_WIDGET_IDS];

/** Default widget visibility used when the stored value is missing. */
export const DEFAULT_WIDGET_SETTINGS: DashboardWidgets = {
  clock: true,
  notes: true,
  todos: true,
  tabs: true,
  bookmarks: true,
  focus: true,
  reading: false,
  summary: true,
};

export const DEFAULT_WIDGETS: Record<string, boolean> = {
  ...DEFAULT_WIDGET_SETTINGS,
};

const ACCENT_COLORS = new Set([
  'hsl(217 91% 60%)',
  'hsl(265 85% 60%)',
  'hsl(188 92% 58%)',
]);

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'dark',
  accentColor: 'hsl(217 91% 60%)',
  backgroundPreset: 'aurora',
  clockFormat: '12',
  density: 'comfortable',
  animationsEnabled: true,
  widgets: { ...DEFAULT_WIDGET_SETTINGS },
  widgetOrder: [...DEFAULT_WIDGET_ORDER],
  shortcuts: {
    focusSearch: true,
    commandPalette: true,
    createNote: true,
    createTask: true,
  },
  focus: {
    focusMinutes: 25,
    breakMinutes: 5,
    notificationsEnabled: false,
  },
  historySuggestions: false,
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  return value === true || value === false ? value : fallback;
}

function asNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function sanitizeBooleanMap(
  raw: unknown,
  fallback: Record<string, boolean>
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  if (!isRecord(raw)) return { ...fallback };
  for (const [key, value] of Object.entries(raw)) {
    result[key] = asBoolean(value, fallback[key] ?? true);
  }
  return result;
}

export function sanitizeWidgetOrder(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_WIDGET_ORDER];
  const known = new Set<string>(DEFAULT_WIDGET_IDS);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    if (seen.has(item)) continue;
    seen.add(item);
    if (!known.has(item)) continue;
    result.push(item);
  }
  // Always keep every known widget in the list.
  for (const id of DEFAULT_WIDGET_ORDER) {
    if (!result.includes(id)) result.push(id);
  }
  return result;
}

export function sanitizeShortcuts(raw: unknown): DashboardShortcuts {
  const fallback: DashboardShortcuts = {
    focusSearch: true,
    commandPalette: true,
    createNote: true,
    createTask: true,
  };
  if (!isRecord(raw)) return { ...fallback };
  return {
    focusSearch: asBoolean(raw['focusSearch'], fallback.focusSearch),
    commandPalette: asBoolean(raw['commandPalette'], fallback.commandPalette),
    createNote: asBoolean(raw['createNote'], fallback.createNote),
    createTask: asBoolean(raw['createTask'], fallback.createTask),
  };
}

export function sanitizeFocusSettings(raw: unknown): FocusSettings {
  const fallback: FocusSettings = {
    focusMinutes: 25,
    breakMinutes: 5,
    notificationsEnabled: false,
  };
  if (!isRecord(raw)) return { ...fallback };
  return {
    focusMinutes: asNumber(raw['focusMinutes'], fallback.focusMinutes, 1, 180),
    breakMinutes: asNumber(raw['breakMinutes'], fallback.breakMinutes, 0, 60),
    notificationsEnabled: asBoolean(
      raw['notificationsEnabled'],
      fallback.notificationsEnabled
    ),
  };
}

export function sanitizeSettings(input: unknown): DashboardSettings {
  const raw = isRecord(input) ? input : {};
  const widgets = sanitizeBooleanMap(raw['widgets'] ?? {}, DEFAULT_WIDGETS);
  const accentColor =
    typeof raw['accentColor'] === 'string' &&
    ACCENT_COLORS.has(raw['accentColor'])
      ? raw['accentColor']
      : DEFAULT_SETTINGS.accentColor;
  return {
    theme: asEnum(raw['theme'], ['light', 'dark', 'system'], 'dark'),
    accentColor,
    backgroundPreset: asString(raw['backgroundPreset'], 'aurora'),
    clockFormat: asEnum(raw['clockFormat'], ['12', '24'], '12'),
    density: asEnum(raw['density'], ['comfortable', 'compact', 'spacious'], 'comfortable'),
    animationsEnabled: asBoolean(raw['animationsEnabled'], true),
    widgets,
    widgetOrder: sanitizeWidgetOrder(raw['widgetOrder']),
    shortcuts: sanitizeShortcuts(raw['shortcuts']),
    focus: sanitizeFocusSettings(raw['focus']),
    historySuggestions: asBoolean(raw['historySuggestions'], false),
  };
}

/** Validate a stored list of quick links; unknown entries are dropped. */
export function sanitizeQuickLinks(raw: unknown): QuickLink[] {
  if (!Array.isArray(raw)) return [];
  const links: QuickLink[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = str(item, 'id');
    const title = str(item, 'title');
    const url = str(item, 'url');
    if (!id || !title || !url) continue;
    links.push({
      id,
      title,
      url,
      icon: str(item, 'icon'),
    });
  }
  return links;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function str(value: Record<string, unknown>, key: string): string | undefined {
  const raw = value[key];
  return typeof raw === 'string' ? raw : undefined;
}
