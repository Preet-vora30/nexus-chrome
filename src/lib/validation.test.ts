import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  sanitizeQuickLinks,
  sanitizeSettings,
  sanitizeWidgetOrder,
} from './validation';
import type { DashboardSettings } from '@/types';

describe('sanitizeSettings', () => {
  it('returns the defaults for an empty object', () => {
    const settings = sanitizeSettings({});
    expect(settings.theme).toBe('dark');
    expect(settings.widgetOrder).toEqual(DEFAULT_SETTINGS.widgetOrder);
    expect(settings.shortcuts.createNote).toBe(true);
    expect(settings.focus.focusMinutes).toBe(25);
    expect(settings.historySuggestions).toBe(false);
  });

  it('keeps valid user values', () => {
    const settings = sanitizeSettings({
      theme: 'light',
      clockFormat: '24',
      density: 'compact',
      historySuggestions: true,
      widgets: { notes: false, todos: true },
    });
    expect(settings.theme).toBe('light');
    expect(settings.clockFormat).toBe('24');
    expect(settings.density).toBe('compact');
    expect(settings.historySuggestions).toBe(true);
    expect(settings.widgets['notes']).toBe(false);
    expect(settings.widgets['todos']).toBe(true);
  });

  it('falls back when values are of the wrong type', () => {
    const settings = sanitizeSettings({
      theme: 42 as unknown as DashboardSettings['theme'],
      clockFormat: '8' as unknown as DashboardSettings['clockFormat'],
      density: 'messy' as unknown as DashboardSettings['density'],
      animationsEnabled: 'no' as unknown as boolean,
    });
    expect(settings.theme).toBe('dark');
    expect(settings.clockFormat).toBe('12');
    expect(settings.density).toBe('comfortable');
    expect(settings.animationsEnabled).toBe(true);
  });

  it('clamps focus durations into the supported range', () => {
    const settings = sanitizeSettings({
      focus: { focusMinutes: 1000, breakMinutes: -5 },
    });
    expect(settings.focus.focusMinutes).toBe(180);
    expect(settings.focus.breakMinutes).toBe(0);
  });

  it('treats unknown widget ids as visible', () => {
    const settings = sanitizeSettings({
      widgets: { clock: false, mystery: true },
    });
    expect(settings.widgets['clock']).toBe(false);
    expect(settings.widgets['mystery']).toBe(true);
  });
});

describe('sanitizeWidgetOrder', () => {
  it('restores the default order when the value is missing', () => {
    expect(sanitizeWidgetOrder(undefined)).toEqual(DEFAULT_SETTINGS.widgetOrder);
  });

  it('keeps only known widgets, without duplicates', () => {
    const order = sanitizeWidgetOrder(['summary', 'notes', 'summary', 'bogus']);
    expect(order).toEqual([
      'summary',
      'notes',
      'clock',
      'todos',
      'tabs',
      'bookmarks',
      'focus',
      'reading',
    ]);
    expect(order).toHaveLength(DEFAULT_SETTINGS.widgetOrder.length);
  });
});

describe('sanitizeQuickLinks', () => {
  it('keeps valid links and drops the rest', () => {
    const links = sanitizeQuickLinks([
      { id: '1', title: 'Google', url: 'https://google.com' },
      { id: '2', title: '', url: 'https://example.com' },
      'not-a-link',
    ]);
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe('1');
  });
});
