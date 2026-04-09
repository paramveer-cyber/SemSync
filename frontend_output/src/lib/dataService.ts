/**
 * dataService.ts
 *
 * Every DB-backed read goes through here instead of calling api.js directly.
 *
 * Strategy
 * ─────────
 * When a page first needs data (e.g. Dashboard loads):
 *   1. Check the cache for that specific key.
 *   2. Cache HIT  → return cached data instantly, no network call.
 *   3. Cache MISS → fetch the requested data AND pre-fetch everything else
 *      the user is likely to need (courses + all per-course stats +
 *      upcomingEvals), store all of it in the cache, then return.
 *
 * This means the very first page the user lands on pays the full cost of
 * loading all data once. Every subsequent page in the same session is instant.
 *
 * After any mutation (create / update / delete) the caller should invalidate
 * the relevant cache keys so the next read re-fetches fresh data.
 */

import * as api from './api';
import {
  cacheGet,
  cacheSet,
  cacheHas,
  cacheInvalidate,
  cacheClear,
  CACHE_KEYS,
} from './sessionCache';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Fetch courses + per-course stats + upcoming evals in one shot and
 * populate the entire cache. Called on the first cache miss of any key.
 */
async function primeCache(): Promise<void> {
  // Run the two "top-level" calls in parallel
  const [{ courses: rawCourses }, { evaluations: upcomingEvals }] =
    await Promise.all([api.getCourses(), api.getUpcomingEvals()]);

  // Store both top-level results
  cacheSet(CACHE_KEYS.courses, rawCourses);
  cacheSet(CACHE_KEYS.upcomingEvals, upcomingEvals);

  // Fetch each course detail in parallel and store individually
  await Promise.all(
    rawCourses.map(async (c: any) => {
      try {
        const detail = await api.getCourse(c.id);
        cacheSet(CACHE_KEYS.course(c.id), detail);
      } catch {
        // store an error sentinel so we don't retry on every render
        cacheSet(CACHE_KEYS.course(c.id), null);
      }
    })
  );
}

// ── Public read API ───────────────────────────────────────────────────────────

/** Returns the courses list, priming the full cache if needed */
export async function fetchCourses(): Promise<any[]> {
  if (!cacheHas(CACHE_KEYS.courses)) {
    await primeCache();
  }
  return cacheGet<any[]>(CACHE_KEYS.courses) ?? [];
}

/** Returns upcoming evaluations, priming the full cache if needed */
export async function fetchUpcomingEvals(): Promise<any[]> {
  if (!cacheHas(CACHE_KEYS.upcomingEvals)) {
    await primeCache();
  }
  return cacheGet<any[]>(CACHE_KEYS.upcomingEvals) ?? [];
}

/**
 * Returns full course detail (course + evaluations + stats).
 * If not yet cached, primes the full cache first.
 * If this specific course still isn't found, falls back to a direct call.
 */
export async function fetchCourse(id: string): Promise<{ course: any; evaluations: any[]; stats: any }> {
  if (!cacheHas(CACHE_KEYS.course(id))) {
    await primeCache();
  }

  const cached = cacheGet<any>(CACHE_KEYS.course(id));

  // null means we stored an error sentinel during primeCache
  if (cached === null || cached === undefined) {
    // Fallback: try a direct call and cache the result
    const detail = await api.getCourse(id);
    cacheSet(CACHE_KEYS.course(id), detail);
    return detail;
  }

  return cached;
}

// ── Invalidation helpers (call after mutations) ───────────────────────────────

/**
 * After creating or deleting a course, invalidate everything
 * (courses list + upcoming evals change, all per-course caches are stale)
 */
export function invalidateAllCourseData(): void {
  // We can't know all course ids, so clear the whole store
  cacheClear();
}

/**
 * After creating / editing / deleting an evaluation inside a course,
 * invalidate that course's cached detail + the upcoming-evals list.
 * The courses list itself (names, credits, target) is still valid.
 */
export function invalidateCourseDetail(courseId: string): void {
  cacheInvalidate(CACHE_KEYS.course(courseId), CACHE_KEYS.upcomingEvals);
}

/** Call on logout so a new user starts with an empty cache */
export function invalidateOnLogout(): void {
  cacheClear();
}
