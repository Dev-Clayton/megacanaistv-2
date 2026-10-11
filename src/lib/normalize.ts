import type { Category, Channel, ChannelsData, EpgMap, Program, SportEvent } from "./types";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

export function normalizeChannels(raw: unknown): ChannelsData {
  if (!isObj(raw)) throw new Error("Resposta inválida da API de canais");
  const categories: Category[] = [];
  const seenCat = new Set<number>();
  for (const c of Array.isArray(raw.categories) ? raw.categories : []) {
    if (!isObj(c)) continue;
    const id = Number(c.id);
    const name = str(c.name);
    if (!Number.isFinite(id) || !name || seenCat.has(id)) continue;
    seenCat.add(id);
    categories.push({ id, name });
  }
  if (!seenCat.has(0)) categories.unshift({ id: 0, name: "Todos" });

  const channels: Channel[] = [];
  const seen = new Set<string>();
  for (const c of Array.isArray(raw.channels) ? raw.channels : []) {
    if (!isObj(c)) continue;
    const id = str(String(c.id ?? ""));
    const name = str(c.name) ?? id;
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    const cats = Array.isArray(c.categories)
      ? [...new Set(c.categories.map(Number).filter(Number.isFinite))]
      : [];
    channels.push({
      id,
      name,
      image: str(c.image),
      preview: str(c.preview),
      url: str(c.url),
      categories: cats,
    });
  }
  return { categories, channels };
}

export function normalizeEvents(raw: unknown): SportEvent[] {
  if (!Array.isArray(raw)) throw new Error("Resposta inválida da API de eventos");
  const out: SportEvent[] = [];
  for (const e of raw) {
    if (!isObj(e)) continue;
    const title = str(e.title);
    if (!title) continue;
    const league = isObj(e.league) ? e.league : {};
    const teams = isObj(e.teams) ? e.teams : {};
    const team = (t: unknown) => ({
      name: (isObj(t) && str(t.name)) || "A definir",
      image: isObj(t) ? str(t.image) : undefined,
    });
    const id = String(e.id ?? title);
    out.push({
      id,
      slug: str(e.slug) ?? id,
      title,
      league: { name: str(league.name) ?? "Outros", image: str(league.image) },
      home: team(teams.home),
      away: team(teams.away),
      start: str(e.time_start),
      end: str(e.time_end),
      players: Array.isArray(e.players) ? e.players.map(str).filter((p): p is string => !!p) : [],
    });
  }
  return out;
}

export function normalizeEpg(raw: unknown): EpgMap {
  if (!Array.isArray(raw)) throw new Error("Resposta inválida da API de programação");
  const map: EpgMap = {};
  for (const r of raw) {
    if (!isObj(r)) continue;
    const id = str(String(r.id ?? ""));
    if (!id || !Array.isArray(r.data)) continue;
    const progs: Program[] = [];
    for (const p of r.data) {
      if (!isObj(p)) continue;
      const title = str(p.title);
      const start = str(p.start_date);
      if (!title || !start || Number.isNaN(Date.parse(start))) continue;
      progs.push({ title, desc: str(p.desc), start });
    }
    progs.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    map[id] = progs;
  }
  return map;
}
