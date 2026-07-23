import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_API_BASE_URL } from "./constants";

/**
 * Backend base URL, persisted across app restarts (Day 5) via
 * AsyncStorage. Previously in-memory only, which meant reopening the app
 * always reset to DEFAULT_API_BASE_URL -- fine when that default already
 * points at the live backend, but this also lets you set a *different*
 * URL (e.g. a local dev backend) and have it actually stick.
 *
 * Pattern: an in-memory value that's the source of truth for synchronous
 * reads (getApiBaseUrl(), used by every API call), backed by AsyncStorage
 * for persistence. On app start, loadPersistedApiBaseUrl() reads from
 * disk and updates the in-memory value once that finishes -- there's a
 * brief window where getApiBaseUrl() still returns the default before
 * that load completes, which is fine since it's still a valid URL, just
 * possibly not the last one you set.
 */

const STORAGE_KEY = "resqai:apiBaseUrl";

let currentBaseUrl = DEFAULT_API_BASE_URL;
let hasLoadedFromStorage = false;
const listeners = new Set<(url: string) => void>();

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  currentBaseUrl = url.trim().replace(/\/+$/, "");
  listeners.forEach((listener) => listener(currentBaseUrl));
  AsyncStorage.setItem(STORAGE_KEY, currentBaseUrl).catch(() => {
    // Non-fatal: the URL still works for this session, it just won't
    // survive a restart if the write failed (e.g. storage full).
  });
}

/**
 * Call once, early (root layout), to load whatever URL was last saved.
 * Safe to call multiple times -- only loads once.
 */
export async function loadPersistedApiBaseUrl(): Promise<void> {
  if (hasLoadedFromStorage) return;
  hasLoadedFromStorage = true;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      currentBaseUrl = saved;
      listeners.forEach((listener) => listener(currentBaseUrl));
    }
  } catch {
    // Fall back to DEFAULT_API_BASE_URL silently -- already the
    // in-memory value, nothing else to do.
  }
}

/** Hook so any screen re-renders when the base URL changes. */
export function useApiBaseUrl(): [string, (url: string) => void] {
  const [url, setUrl] = useState(currentBaseUrl);

  useEffect(() => {
    const listener = (newUrl: string) => setUrl(newUrl);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return [url, setApiBaseUrl];
}
