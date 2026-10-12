import { describe, expect, it } from "vitest";
import { currentProgramIndex, eventStatus } from "@/lib/time";
import { normalizeChannels } from "@/lib/normalize";

const progs = [
  { title: "A", start: "2026-10-10T00:11:00-03:00" },
  { title: "B", start: "2026-10-10T00:33:00-03:00" },
];
const t = (s: string) => Date.parse(s);

describe("EPG current program", () => {
  it("is the one started whose next has not begun", () => {
    expect(currentProgramIndex(progs, t("2026-10-10T00:20:00-03:00"))).toBe(0);
    expect(currentProgramIndex(progs, t("2026-10-10T00:33:00-03:00"))).toBe(1);
  });
  it("none before the first start", () => {
    expect(currentProgramIndex(progs, t("2026-10-10T00:00:00-03:00"))).toBe(-1);
  });
});

describe("event status by time", () => {
  const e = { start: "2026-10-10T15:00:00-03:00", end: "2026-10-10T17:00:00-03:00" };
  it("upcoming / live / ended", () => {
    expect(eventStatus(e, t("2026-10-10T14:59:00-03:00"))).toBe("upcoming");
    expect(eventStatus(e, t("2026-10-10T16:00:00-03:00"))).toBe("live");
    expect(eventStatus(e, t("2026-10-10T17:00:00-03:00"))).toBe("ended");
  });
});

describe("channels normalization", () => {
  it("adds a virtual Todos and dedupes channels", () => {
    const d = normalizeChannels({
      categories: [{ id: 1, name: "Esportes" }],
      channels: [
        { id: "a", name: "A", categories: [1, 1] },
        { id: "a", name: "A dup", categories: [1] },
      ],
    });
    expect(d.categories[0]).toEqual({ id: 0, name: "Todos" });
    expect(d.channels).toHaveLength(1);
    expect(d.channels[0]!.categories).toEqual([1]);
  });
});
