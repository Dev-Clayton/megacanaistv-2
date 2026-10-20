import { describe, expect, it } from "vitest";
import { buildCandidates, resolveRecommendations } from "@/lib/recommendations";

const channel = { id: "test", name: "Canal teste", categories: [], url: "https://example.com/player" };
const now = Date.parse("2026-10-20T23:00:00Z");
describe("schedule-grounded recommendations", () => {
  it("includes current and upcoming programs, excluding ended programs", () => {
    const result = buildCandidates([channel], { test: [{ title: "Encerrado", start: "2026-10-20T20:00:00Z" }, { title: "Atual", start: "2026-10-20T22:00:00Z" }, { title: "Próximo", start: "2026-10-21T00:00:00Z" }] }, now);
    expect(result.map((p) => [p.title, p.status])).toEqual([["Atual", "current"], ["Próximo", "upcoming"]]);
  });
  it("does not invent a program when the schedule is missing", () => {
    expect(buildCandidates([channel], {}, now)[0]).toMatchObject({ title: "Canal teste", start: null, status: "channel" });
  });
  it("rejects model selections absent from the available schedule", () => {
    expect(resolveRecommendations({ summary: "", selections: [{ candidateId: "invented", reason: "test" }] }, buildCandidates([channel], {}, now))).toEqual([]);
  });
  it("excludes channels without a player", () => {
    expect(buildCandidates([{ ...channel, url: undefined }], {}, now)).toEqual([]);
  });
});