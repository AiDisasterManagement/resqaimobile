import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "../api/client";
import type { SubmitRescueRequest, SubmitRescueRequestResponse } from "../api/types";

/**
 * Day 6: offline request queueing for the SOS screen.
 *
 * If a submission fails because the device has no connectivity (not
 * because the server rejected it), we don't want to just show an error
 * and lose it -- this is an emergency request. Instead we save it to
 * disk and retry automatically the next time the app opens, or when the
 * user taps "Retry now".
 *
 * Distinguishing "no connectivity" from "server rejected it" matters:
 * client.ts's request() throws an ApiError with status 0 specifically
 * when fetch() itself failed (couldn't reach the server at all -- see
 * the catch block around fetch() in src/api/client.ts). Any other
 * ApiError means the server *was* reached and responded with a real
 * HTTP error (e.g. 400 bad payload), which won't fix itself by
 * retrying, so those are dropped rather than queued forever.
 *
 * Each queued item carries the same client_request_id it would have
 * sent originally, so if the *first* attempt actually reached the
 * backend and persisted before the network dropped (the response just
 * never made it back to the phone), retrying is still safe -- the
 * backend's dedup logic (Day 6, main.py) recognizes the client_request_id
 * and returns the original result instead of creating a second one.
 */

export interface QueuedRequest {
  client_request_id: string;
  payload: SubmitRescueRequest;
  queued_at: number;
}

const STORAGE_KEY = "resqai:offlineQueue";

let queue: QueuedRequest[] = [];
let hasLoaded = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<(queue: QueuedRequest[]) => void>();

function notify() {
  listeners.forEach((l) => l([...queue]));
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Non-fatal -- the in-memory queue is still correct for this
    // session, it just won't survive an app restart if the write failed.
  }
}

async function ensureLoaded(): Promise<void> {
  if (hasLoaded) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        queue = raw ? JSON.parse(raw) : [];
      } catch {
        queue = [];
      }
      hasLoaded = true;
      notify();
    })();
  }
  return loadPromise;
}

/** Call once, early (root layout), so a queue from a previous session is
 * loaded and an initial flush attempt is made if connectivity is back. */
export async function initOfflineQueue(): Promise<void> {
  await ensureLoaded();
  await flushOfflineQueue();
}

export function getQueue(): QueuedRequest[] {
  return [...queue];
}

export async function enqueueOfflineRequest(
  client_request_id: string,
  payload: SubmitRescueRequest
): Promise<void> {
  await ensureLoaded();
  queue.push({ client_request_id, payload, queued_at: Date.now() });
  await persist();
  notify();
}

export interface FlushResult {
  submitted: number;
  dropped: number;
  stillQueued: number;
}

/**
 * Attempts every queued request in order (oldest first, so priority
 * ordering at the backend reflects real submission time). Stops at the
 * first item that fails due to no connectivity, since later items would
 * fail the same way -- no point burning through the whole queue on a
 * dead connection. A real server rejection (not a connectivity issue)
 * drops just that one item and continues to the next.
 */
export async function flushOfflineQueue(): Promise<FlushResult> {
  await ensureLoaded();
  let submitted = 0;
  let dropped = 0;

  while (queue.length > 0) {
    const item = queue[0];
    try {
      const res: SubmitRescueRequestResponse = await api.submitRescueRequest(item.payload);
      if (res.persisted) {
        queue.shift();
        submitted++;
        await persist();
        notify();
      } else {
        // Backend reachable but couldn't save (e.g. its own DB hiccup) --
        // treat like a connectivity issue and stop here rather than
        // silently dropping an unsaved emergency request.
        break;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        // Still offline -- stop, leave this and everything after it queued.
        break;
      }
      // Real server-side rejection (e.g. malformed payload) -- retrying
      // won't help, drop it so it doesn't block items behind it forever.
      queue.shift();
      dropped++;
      await persist();
      notify();
    }
  }

  return { submitted, dropped, stillQueued: queue.length };
}

/** Hook: current queue length + a manual retry trigger, for the SOS screen. */
export function useOfflineQueue(): {
  queueLength: number;
  flushing: boolean;
  retryNow: () => Promise<FlushResult>;
} {
  const [items, setItems] = useState<QueuedRequest[]>(queue);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    ensureLoaded();
    const listener = (q: QueuedRequest[]) => setItems(q);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const retryNow = useCallback(async () => {
    setFlushing(true);
    try {
      return await flushOfflineQueue();
    } finally {
      setFlushing(false);
    }
  }, []);

  return { queueLength: items.length, flushing, retryNow };
}
