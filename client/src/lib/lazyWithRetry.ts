/**
 * lazyWithRetry — React.lazy wrapper with automatic chunk error recovery.
 *
 * Problem: After a new deploy, browsers may have cached the old HTML (which
 * references old chunk hashes). When React.lazy tries to fetch a chunk that
 * no longer exists on the server, it throws "Failed to fetch dynamically
 * imported module". This is especially common on Safari/iOS.
 *
 * Solution:
 * 1. Retry up to MAX_RETRIES times with exponential backoff.
 * 2. On the final retry, append a cache-bust query param (?t=<timestamp>)
 *    to force the browser to bypass the cache and load the latest chunk.
 * 3. If all retries fail, throw the original error so the ErrorBoundary
 *    can catch it and show the "Atualizar aplicação" UI.
 */

import { lazy } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800; // base delay; doubles each attempt

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Detects whether an error is a chunk-loading failure.
 * Covers Chrome, Firefox, Safari, and Vite-specific messages.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("networkerror") ||
    // Safari-specific
    msg.includes("cannot load") ||
    msg.includes("load failed") ||
    // Vite-specific
    msg.includes("error loading")
  );
}

/**
 * Wraps a dynamic import factory with retry logic.
 * Usage: const MyPage = lazyWithRetry(() => import('./pages/MyPage'));
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 800ms, 1600ms, 3200ms
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        }

        // On the last attempt, force a cache-bust by appending ?t=<timestamp>
        // to the import URL. This bypasses stale browser/CDN caches.
        if (attempt === MAX_RETRIES) {
          const cacheBust = `?t=${Date.now()}`;
          // Vite resolves dynamic imports at build time, so we can't modify
          // the URL directly. Instead, we reload the page — the server will
          // return the new HTML with updated chunk references.
          // We set a flag in sessionStorage to avoid infinite reload loops.
          const reloadKey = "riddy_chunk_reload_attempted";
          const alreadyReloaded = sessionStorage.getItem(reloadKey);

          if (!alreadyReloaded) {
            sessionStorage.setItem(reloadKey, "1");
            // Small delay to let the error boundary render first
            await sleep(200);
            window.location.reload();
            // Return a dummy module to satisfy TypeScript (reload will interrupt)
            return { default: (() => null) as unknown as T };
          }
          // If we already reloaded and still failing, clear the flag and throw
          sessionStorage.removeItem(reloadKey);
        }

        const module = await importFn();
        // Success — clear any previous reload flag
        sessionStorage.removeItem("riddy_chunk_reload_attempted");
        return module;
      } catch (error) {
        lastError = error;

        // Only retry on chunk-load errors, not on syntax/runtime errors
        if (!isChunkLoadError(error)) {
          throw error;
        }

        console.warn(
          `[lazyWithRetry] Chunk load failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          (error as Error).message
        );
      }
    }

    throw lastError;
  });
}
