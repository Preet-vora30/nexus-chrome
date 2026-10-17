import { useCallback, useEffect, useRef, useState } from 'react';
import { themeStorage } from '@/lib/storage';
import type { ResolvedTheme, ThemeMode } from '@/lib/chrome';

/**
 * Syncs the selected theme mode with `chrome.storage.sync` and the `data-theme`
 * attribute on the document element so CSS variables resolve correctly.
 *
 * Modes:
 *  - 'light'  -> force light
 *  - 'dark'   -> force dark
 *  - 'system' -> follow the operating system preference
 *
 * Returns the resolved theme ('light' | 'dark') as `theme`, the stored mode
 * as `mode`, and a `toggle` that cycles light → dark → system → light.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);
  /** True once the user has explicitly toggled the theme. */
  const userSetModeRef = useRef(false);

  const applyTheme = useCallback((next: ThemeMode) => {
    const resolved: ResolvedTheme =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : next === 'light'
          ? 'light'
          : 'dark';
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  useEffect(() => {
    setMounted(true);
    void themeStorage.get<ThemeMode>('theme', 'dark').then((saved) => {
      // Don't overwrite a mode the user has already chosen.
      if (!userSetModeRef.current) {
        setMode(saved);
        applyTheme(saved);
      }
    });
  }, [applyTheme]);

  // Re-resolve when the stored mode changes.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(mode);
  }, [mode, mounted, applyTheme]);

  // Follow system preference changes when in system mode.
  useEffect(() => {
    if (!mounted || mode !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [mode, mounted]);

  const toggle = useCallback(() => {
    userSetModeRef.current = true;
    const next: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(next);
    applyTheme(next);
    void themeStorage.set('theme', next);
  }, [mode, applyTheme]);

  return { mode, theme, toggle, mounted };
}
