import { createServerFn } from "@tanstack/react-start";

const API = "https://redeflixapi.store";
const TMDB = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p/w500";

export type CatalogKind = "movie" | "tv" | "anime" | "dorama";
export type CatalogItem = {
  id: string;
  title: string;
  year?: string;
  overview?: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  kind: CatalogKind;
  seasons?: Record<string, Record<string, string>>;
};
export type CatalogDetails = CatalogItem & { playerUrl: string };

const safeText = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : undefined;
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(18000) });
  if (!response.ok) throw new Error(`Serviço de catálogo respondeu HTTP ${response.status}`);
  return response.json();
}
async function getText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: "text/plain, application/json" }, signal: AbortSignal.timeout(18000) });
  if (!response.ok) throw new Error(`Lista de catálogo respondeu HTTP ${response.status}`);
  return response.text();
}
function tmdbKey() {
  return typeof process !== "undefined" ? process.env.TMDB_API_KEY : undefined;
}

async function enrichWithTmdb(item: CatalogItem): Promise<CatalogItem> {
  const key = tmdbKey();
  if (!key) return item;
  try {
    const endpoint = item.kind === "movie" ? "movie" : "tv";
    const raw = await getJson(`${TMDB}/${endpoint}/${encodeURIComponent(item.id)}?api_key=${encodeURIComponent(key)}&language=pt-BR`);
    if (!object(raw)) return item;
    return {
      ...item,
      title: safeText(raw.title) ?? safeText(raw.name) ?? item.title,
      year: (safeText(raw.release_date) ?? safeText(raw.first_air_date) ?? item.year)?.slice(0, 4),
      overview: safeText(raw.overview) ?? item.overview,
      poster: safeText(raw.poster_path) ? `${IMAGE}${raw.poster_path}` : item.poster,
      backdrop: safeText(raw.backdrop_path) ? `https://image.tmdb.org/t/p/w1280${raw.backdrop_path}` : item.backdrop,
      rating: typeof raw.vote_average === "number" ? raw.vote_average : item.rating,
    };
  } catch {
    return item;
  }
}

async function readSeriesList(kind: Exclude<CatalogKind, "movie">, enrich = true): Promise<CatalogItem[]> {
  const endpoint = kind === "tv" ? "list-tv-ids.txt" : kind === "anime" ? "list-anime-ids.txt" : "list-dorama-ids.txt";
  const raw = await getJson(`${API}/${endpoint}`);
  const rows = Array.isArray(raw) ? raw : object(raw) && Array.isArray(raw.items) ? raw.items : [];
  const items: CatalogItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!object(row)) continue;
    const id = String(row.id_tmdb ?? row.id ?? "").trim();
    if (!/^\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const seasons: Record<string, Record<string, string>> = {};
    const episodesRaw = object(row.episodios) ? row.episodios : {};
    for (const [season, episodes] of Object.entries(episodesRaw)) {
      if (!object(episodes)) continue;
      seasons[season] = {};
      for (const [episode, url] of Object.entries(episodes)) {
        if (typeof url === "string" && /^https:\/\/redeflixapi\.store\/serie\/\d+\/\d+\/\d+/.test(url)) seasons[season]![episode] = url;
      }
    }
    const posterValue = safeText(row.poster) ?? safeText(row.poster_path);
    items.push({
      id,
      title: safeText(row.nome) ?? `Série ${id}`,
      year: row.ano == null ? undefined : String(row.ano),
      poster: posterValue?.startsWith("/") ? `${IMAGE}${posterValue}` : posterValue,
      overview: safeText(row.sinopse) ?? safeText(row.overview),
      kind,
      seasons,
    });
  }
  const selected = items.slice(0, 48);
  if (!enrich || !tmdbKey()) return selected;
  const enriched: CatalogItem[] = [];
  for (let i = 0; i < selected.length; i += 6) enriched.push(...await Promise.all(selected.slice(i, i + 6).map(enrichWithTmdb)));
  return enriched;
}

async function readMovies(): Promise<CatalogItem[]> {
  const text = await getText(`${API}/list-movie-ids.txt`);
  const ids = [...new Set(text.split(/\s+/).map((v) => v.trim()).filter((v) => /^\d+$/.test(v)))].slice(0, 48);
  const items: CatalogItem[] = ids.map((id) => ({ id, title: `Filme ${id}`, kind: "movie" }));
  if (!tmdbKey()) return items;
  const enriched: CatalogItem[] = [];
  for (let i = 0; i < items.length; i += 6) enriched.push(...await Promise.all(items.slice(i, i + 6).map(enrichWithTmdb)));
  return enriched;
}

export const fetchMovies = createServerFn({ method: "GET" }).handler(async () => readMovies());
export const fetchSeries = createServerFn({ method: "GET" }).handler(async () => readSeriesList("tv"));
export const fetchAnime = createServerFn({ method: "GET" }).handler(async () => readSeriesList("anime"));
export const fetchDorama = createServerFn({ method: "GET" }).handler(async () => readSeriesList("dorama"));

export const fetchMovieDetails = createServerFn({ method: "GET" }).inputValidator((input: { id: string }) => input).handler(async ({ data }) => {
  if (!/^\d+$/.test(data.id)) throw new Error("ID TMDB inválido");
  const item = await enrichWithTmdb({ id: data.id, title: `Filme ${data.id}`, kind: "movie" });
  return { ...item, playerUrl: `${API}/filme/${data.id}` } satisfies CatalogDetails;
});

export const fetchSeriesDetails = createServerFn({ method: "GET" }).inputValidator((input: { id: string; kind?: "tv" | "anime" | "dorama" }) => input).handler(async ({ data }) => {
  if (!/^\d+$/.test(data.id)) throw new Error("ID TMDB inválido");
  const kind = data.kind ?? "tv";
  const lists = await readSeriesList(kind, false);
  const item = lists.find((entry) => entry.id === data.id) ?? { id: data.id, title: `Série ${data.id}`, kind, seasons: {} };
  const enriched = await enrichWithTmdb(item);
  return { ...enriched, playerUrl: `${API}/serie/${data.id}/1/1` } satisfies CatalogDetails;
});
