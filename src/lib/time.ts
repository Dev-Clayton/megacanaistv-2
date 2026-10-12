import type { Program, SportEvent } from "./types";

const TZ = "America/Sao_Paulo";
/** Assumed duration of the last program in a list (no end time available). */
export const LAST_PROGRAM_MAX_MS = 3 * 60 * 60 * 1000;
/** Assumed duration of an event without time_end. */
export const DEFAULT_EVENT_MS = 150 * 60 * 1000;

export function formatTime(iso?: string) {
  if (!iso) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function formatDay(iso?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: TZ }).format(new Date(iso));
}

/** Index of the program airing at `now`, or -1. Programs must be sorted by start. */
export function currentProgramIndex(programs: Program[], now: number): number {
  for (let i = programs.length - 1; i >= 0; i--) {
    const start = Date.parse(programs[i]!.start);
    if (start <= now) {
      const next = programs[i + 1];
      const end = next ? Date.parse(next.start) : start + LAST_PROGRAM_MAX_MS;
      return now < end ? i : -1;
    }
  }
  return -1;
}

/** Current program (if any) followed by upcoming programs. */
export function programWindow(programs: Program[], now: number, count = 8) {
  const cur = currentProgramIndex(programs, now);
  const upcoming = programs.filter((p) => Date.parse(p.start) > now);
  return {
    current: cur >= 0 ? programs[cur]! : undefined,
    currentEnd: cur >= 0 ? programs[cur + 1]?.start : undefined,
    upcoming: upcoming.slice(0, count),
  };
}

export type EventStatus = "live" | "upcoming" | "ended" | "unknown";

export function eventStatus(e: Pick<SportEvent, "start" | "end">, now: number): EventStatus {
  if (!e.start) return "unknown";
  const start = Date.parse(e.start);
  if (Number.isNaN(start)) return "unknown";
  const endParsed = e.end ? Date.parse(e.end) : NaN;
  const end = Number.isNaN(endParsed) ? start + DEFAULT_EVENT_MS : endParsed;
  if (now < start) return "upcoming";
  if (now < end) return "live";
  return "ended";
}
