import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clapperboard, Search, Tv } from "lucide-react";
import { useState } from "react";
import { fetchAnime, fetchDorama, fetchSeries } from "@/lib/catalog";
import type { CatalogKind } from "@/lib/catalog";
import { CatalogCard } from "@/components/mc/CatalogCard";
import { EmptyState, ErrorState } from "@/components/mc/ui";
import { cn } from "@/lib/utils";

const tvQuery = { queryKey: ["catalog", "series"], queryFn: () => fetchSeries(), staleTime: 15 * 60 * 1000 };
const animeQuery = { queryKey: ["catalog", "anime"], queryFn: () => fetchAnime(), staleTime: 15 * 60 * 1000 };
const doramaQuery = { queryKey: ["catalog", "dorama"], queryFn: () => fetchDorama(), staleTime: 15 * 60 * 1000 };
const schema = { parse: (input: unknown) => ({ kind: (input as { kind?: string })?.kind === "anime" || (input as { kind?: string })?.kind === "dorama" ? (input as { kind: "anime" | "dorama" }).kind : "tv" as const }) };

export const Route = createFileRoute("/series")({
  validateSearch: schema,
  head: () => ({ meta: [{ title: "Séries, animes e doramas — Mega Canais TV" }, { name: "description", content: "Explore séries, animes e doramas pelo catálogo TMDB." }] }),
  loader: async ({ context, location }) => {
    const kind = new URLSearchParams(location.search).get("kind");
    if (kind === "anime") return context.queryClient.ensureQueryData(animeQuery);
    if (kind === "dorama") return context.queryClient.ensureQueryData(doramaQuery);
    return context.queryClient.ensureQueryData(tvQuery);
  },
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: SeriesPage,
});
function SeriesPage() {
  const { kind } = Route.useSearch();
  const [q, setQ] = useState("");
  const query = kind === "anime" ? animeQuery : kind === "dorama" ? doramaQuery : tvQuery;
  const { data } = useSuspenseQuery(query);
  const list = data.filter((item) => item.title.toLowerCase().includes(q.trim().toLowerCase()));
  const tabs: { value: CatalogKind; label: string }[] = [{ value: "tv", label: "Séries" }, { value: "anime", label: "Animes" }, { value: "dorama", label: "Doramas" }];
  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-card p-6 md:p-10"><span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"><Clapperboard className="size-4" /> Catálogo de entretenimento</span><h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Séries, animes e doramas</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">Encontre sua próxima maratona. As temporadas e os episódios disponíveis são exibidos na página de cada título.</p></section>
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Tipo de catálogo">{tabs.map((tab) => <Link key={tab.value} to="/series" search={{ kind: tab.value === "anime" || tab.value === "dorama" ? tab.value : "tv" }} role="tab" aria-selected={kind === tab.value} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition", kind === tab.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>{tab.label}</Link>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Tv className="size-4" /> {list.length} títulos no catálogo</div><label className="flex h-11 w-full items-center gap-2 rounded-full border bg-card px-4 focus-within:ring-2 focus-within:ring-ring sm:max-w-sm"><Search className="size-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar título…" aria-label="Buscar séries" className="w-full bg-transparent text-sm outline-none" /></label></div>
      {list.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{list.map((item) => <CatalogCard key={item.id} item={item} to="/serie/$id" search={{ kind: item.kind }} />)}</div> : <EmptyState title="Nenhum título encontrado" text="Tente outro nome ou selecione outra categoria." />}
    </div>
  );
}
