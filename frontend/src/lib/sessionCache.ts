interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, cachedAt: Date.now() });
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  return entry?.data;
}

export function cacheHas(key: string): boolean {
  return store.has(key);
}

export function cacheInvalidate(...keys: string[]): void {
  keys.forEach(k => store.delete(k));
}

export function cacheClear(): void {
  store.clear();
}

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

export const CACHE_KEYS = {
  courses: 'courses',
  archivedCourses: 'archivedCourses',
  upcomingEvals: 'upcomingEvals',
  course: (id: string) => `course:${id}`,
  achievementCatalog: 'achievementCatalog',
} as const;
