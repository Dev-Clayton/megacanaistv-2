import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { normalizeChannels, normalizeEpg, normalizeEvents } from "./normalize";

const BASE = "https://embedtv.lat/api";

// Cache em memória do servidor: evita consultar a API externa em toda navegação.
// Quando expira, devolve o último valor disponível enquanto atualiza em segundo plano.
type CacheEntry = { value?: unknown; expiresAt: number; pending?: Promise<unknown> };
const responseCache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = responseCache.get(key) as CacheEntry | undefined;
  if (entry?.value !== undefined && entry.expiresAt > now) return entry.value as T;
  if (entry?.pending) {
    if (entry.value !== undefined) return entry.value as T;
    return entry.pending as Promise<T>;
  }

  const pending = load().then((value) => {
    responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }).catch((error) => {
    // Se a API falhar, conserva o último resultado para evitar derrubar o catálogo.
    if (entry?.value !== undefined) {
      responseCache.set(key, { value: entry.value, expiresAt: Date.now() + Math.min(ttlMs, 30_000) });
      return entry.value as T;
    }
    responseCache.delete(key);
    throw error;
  });

  responseCache.set(key, { value: entry?.value, expiresAt: entry?.expiresAt ?? 0, pending });
  if (entry?.value !== undefined) {
    void pending.catch(() => undefined);
    return entry.value as T;
  }
  return pending;
}

async function getJson(urls: string[]): Promise<unknown> {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 MegaCanaisTV" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return JSON.parse(await res.text());
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Falha ao conectar à API (${String((lastErr as Error)?.message ?? lastErr)})`);
}

export const fetchChannels = createServerFn({ method: "GET" }).handler(async () =>
  cached("channels", 5 * 60 * 1000, async () =>
    normalizeChannels(await getJson([`${BASE}/getcanais.json`, `${BASE}/channels`])),
  ),
);
export const fetchEvents = createServerFn({ method: "GET" }).handler(async () =>
  cached("events", 60 * 1000, async () => normalizeEvents(await getJson([`${BASE}/events`]))),
);
export const fetchEpg = createServerFn({ method: "GET" }).handler(async () =>
  cached("epg", 10 * 60 * 1000, async () => normalizeEpg(await getJson([`${BASE}/epg_all`]))),
);

export const channelsQuery = queryOptions({
  queryKey: ["channels"],
  queryFn: () => fetchChannels(),
  staleTime: 10 * 60 * 1000,
});
export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: () => fetchEvents(),
  staleTime: 2 * 60 * 1000,
  refetchInterval: 2 * 60 * 1000,
});
export const epgQuery = queryOptions({
  queryKey: ["epg"],
  queryFn: () => fetchEpg(),
  staleTime: 15 * 60 * 1000,
});
