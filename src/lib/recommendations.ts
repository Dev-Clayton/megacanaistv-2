import { z } from "zod";
import { programWindow } from "./time";
import type { Channel, EpgMap } from "./types";

export const recommendationSchema = z.object({
  summary: z.string(),
  selections: z.array(z.object({ candidateId: z.string(), reason: z.string() })),
});
export type RecommendationCandidate = { candidateId: string; channelId: string; channelName: string; image: string | null; title: string; description: string; start: string | null; status: "current" | "upcoming" | "channel" };
export type Recommendation = RecommendationCandidate & { reason: string };

export function buildCandidates(channels: Channel[], epg: EpgMap, now: number): RecommendationCandidate[] {
  return channels.filter((c) => c.url).flatMap((channel) => {
    const window = programWindow(epg[channel.id] ?? [], now, 4);
    const base = { channelId: channel.id, channelName: channel.name, image: channel.image ?? null };
    const programs: RecommendationCandidate[] = [];
    if (window.current) programs.push({ ...base, candidateId: `${channel.id}:${window.current.start}`, title: window.current.title, description: window.current.desc ?? "", start: window.current.start, status: "current" });
    for (const p of window.upcoming) programs.push({ ...base, candidateId: `${channel.id}:${p.start}`, title: p.title, description: p.desc ?? "", start: p.start, status: "upcoming" });
    return programs.length ? programs : [{ ...base, candidateId: `channel:${channel.id}`, title: channel.name, description: "Programação indisponível; recomendar somente pelo canal, sem inventar programas ou horários.", start: null, status: "channel" as const }];
  });
}

export function resolveRecommendations(output: z.infer<typeof recommendationSchema>, candidates: RecommendationCandidate[]): Recommendation[] {
  const seen = new Set<string>();
  return output.selections.flatMap((selection) => {
    const candidate = candidates.find((c) => c.candidateId === selection.candidateId);
    if (!candidate || seen.has(candidate.candidateId)) return [];
    seen.add(candidate.candidateId);
    return [{ ...candidate, reason: selection.reason.slice(0, 500) }];
  }).slice(0, 6);
}