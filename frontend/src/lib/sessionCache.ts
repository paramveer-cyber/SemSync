/**
 * sessionCache.ts
 *
 * An in-memory cache that lives for exactly one browser session.
 * - Stored as a plain JS object in module scope (NOT localStorage/sessionStorage)
 * - Users cannot inspect or modify it from the browser console like they could
 *   with localStorage (it has no key name, it's just a variable in a closure)
 * - Automatically wiped on page refresh, tab close, or navigation away —
 *   because module-level variables reset when the JS runtime reloads
 * - Shared across all React components that import this module within the same tab
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number; // timestamp ms
}

// The actual store — a plain object, never touched by the browser
const store = new Map<string, CacheEntry<unknown>>();

/** Write a value into the cache under the given key */
export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, cachedAt: Date.now() });
}

/** Read a cached value; returns undefined if not present */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  return entry?.data;
}

/** Check whether a key exists in the cache */
export function cacheHas(key: string): boolean {
  return store.has(key);
}

/** Remove one or more keys — call this after a mutation so stale data is gone */
export function cacheInvalidate(...keys: string[]): void {
  keys.forEach(k => store.delete(k));
}

/** Wipe everything (e.g. on logout) */
export function cacheClear(): void {
  store.clear();
}

// ── Cache key constants ───────────────────────────────────────────────────────
// Centralised so every file uses the same strings
export const CACHE_KEYS = {
  courses: 'courses',
  upcomingEvals: 'upcomingEvals',
  /** per-course key: pass the course id */
  course: (id: string) => `course:${id}`,
} as const;
