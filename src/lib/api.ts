import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { normalizeChannels, normalizeEpg, normalizeEvents } from "./normalize";

const BASE = "https://embedtv.lat/api";

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
  normalizeChannels(await getJson([`${BASE}/getcanais.json`, `${BASE}/channels`])),
);
export const fetchEvents = createServerFn({ method: "GET" }).handler(async () =>
  normalizeEvents(await getJson([`${BASE}/events`])),
);
export const fetchEpg = createServerFn({ method: "GET" }).handler(async () =>
  normalizeEpg(await getJson([`${BASE}/epg_all`])),
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
