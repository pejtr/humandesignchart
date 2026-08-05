const CHUNK_RELOAD_PREFIX = "hd:stale-chunk-reload";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /chunkloaderror/i,
  /loading chunk [\w-]+ failed/i,
  /css_chunk_load_failed/i,
  /error loading dynamically imported module/i,
];

type StorageLike = Pick<Storage, "getItem" | "setItem">;

interface ChunkRecoveryOptions {
  pathname: string;
  reload: () => void;
  storage: StorageLike;
  now?: () => number;
}

type VitePreloadErrorEvent = Event & { payload?: unknown };

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
}

export function isStaleChunkError(error: unknown): boolean {
  const message = errorMessage(error);
  return CHUNK_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Reload once when an already-open SPA references a chunk removed by a newer deploy.
 * A per-path cooldown prevents a genuine network or server failure from causing a loop.
 */
export function recoverStaleChunk(
  error: unknown,
  { pathname, reload, storage, now = Date.now }: ChunkRecoveryOptions
): boolean {
  if (!isStaleChunkError(error)) return false;

  const key = `${CHUNK_RELOAD_PREFIX}:${pathname}`;
  const currentTime = now();

  try {
    const previousReload = Number(storage.getItem(key));
    if (
      Number.isFinite(previousReload) &&
      previousReload > 0 &&
      currentTime - previousReload < CHUNK_RELOAD_COOLDOWN_MS
    ) {
      return false;
    }
    storage.setItem(key, String(currentTime));
  } catch {
    // If browser storage is unavailable, keep the normal error boundary instead
    // of risking an uncontrolled reload loop.
    return false;
  }

  reload();
  return true;
}

export function installStaleChunkRecovery(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handlePreloadError = (event: Event) => {
    const preloadEvent = event as VitePreloadErrorEvent;
    const recovered = recoverStaleChunk(preloadEvent.payload, {
      pathname: window.location.pathname,
      reload: () => window.location.reload(),
      storage: window.sessionStorage,
    });

    if (recovered) preloadEvent.preventDefault();
  };

  window.addEventListener("vite:preloadError", handlePreloadError);
  return () => window.removeEventListener("vite:preloadError", handlePreloadError);
}
