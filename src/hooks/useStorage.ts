import { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '@/lib/storage';

type Updater<T> = (prev: T) => T;

/**
 * React binding for Chrome Storage. Returns the persisted value (or the
 * default before it loads) and a setter that writes to Chrome Storage.
 *
 * Every page that mounts this hook re-reads its own keys on mount, and a
 * `chrome.storage.onChanged` listener keeps already mounted pages in sync
 * when another page (for example the popup or the side panel) writes the
 * same key. Listeners are removed on unmount, and writes triggered by our
 * own listener are skipped so they do not cause render loops.
 */
export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    let cancelled = false;
    void storage.get<T>(key, defaultValue).then((saved) => {
      if (cancelled) return;
      setValue(saved);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key, defaultValue]);

  useEffect(() => {
    if (
      typeof chrome === 'undefined' ||
      !chrome.storage ||
      !chrome.storage.onChanged
    ) {
      return undefined;
    }
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return;
      const change = changes[key];
      if (!change) return;
      const incoming = change.newValue as T;
      if (isSameValue(incoming, valueRef.current)) return;
      setValue(incoming);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [key]);

  const set = useCallback(
    (next: T | Updater<T>) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as Updater<T>)(current) : next;
        void storage.set(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [loaded ? value : defaultValue, set] as [
    T,
    (next: T | Updater<T>) => void,
  ];
}

function isSameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
