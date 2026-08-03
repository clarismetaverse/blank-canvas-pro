import { QueryClient, type DehydratedState } from "@tanstack/react-query";
import { dehydrate, hydrate } from "@tanstack/react-query";

const STORAGE_KEY = "vic-query-cache-v1";
const CACHE_VERSION = 1;
const STALE_TIME = 3 * 60 * 1000; // 3 minutes
const GC_TIME = 12 * 60 * 60 * 1000; // 12 hours

type PersistedCache = {
  version: number;
  timestamp: number;
  state: DehydratedState;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function hydrateQueryCache(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as PersistedCache;
    if (!parsed || parsed.version !== CACHE_VERSION) {
      storage.removeItem(STORAGE_KEY);
      return;
    }
    if (Date.now() - parsed.timestamp > GC_TIME) {
      storage.removeItem(STORAGE_KEY);
      return;
    }

    hydrate(queryClient, parsed.state);
  } catch (err) {
    console.warn("[queryClient] failed to hydrate persisted cache", err);
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

function persistQueryCache(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && query.state.data !== undefined,
    });

    const payload: PersistedCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      state,
    };

    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[queryClient] failed to persist cache", err);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function startQueryCachePersistence(): () => void {
  const storage = getStorage();
  if (!storage) return () => undefined;

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistQueryCache, 1000);
  });

  return () => {
    if (persistTimer) clearTimeout(persistTimer);
    unsubscribe();
  };
}

export function clearPersistedQueryCache(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function clearQueryCache(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  queryClient.clear();
  clearPersistedQueryCache();
}
