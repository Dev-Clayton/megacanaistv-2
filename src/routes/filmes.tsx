import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Film, Search } from "lucide-react";
import { useState } from "react";
import { fetchMovies } from "@/lib/catalog";
import { CatalogCard } from "@/components/mc/CatalogCard";
import { EmptyState, ErrorState } from "@/components/mc/ui";

const moviesQuery = { queryKey: ["catalog", "movies"], queryFn: () => fetchMovies(), staleTime: 15 * 60 * 1000 };
export const Route = createFileRoute("/filmes")({
  head: () => ({ meta: [{ title: "Filmes — Mega Canais TV" }, { name: "description", content: "Explore filmes pelo catálogo TMDB e assista pelo player integrado." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(moviesQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: MoviesPage,
});
function MoviesPage() {
  const { data } = useSuspenseQuery(moviesQuery);
  const [q, setQ] = useState("");
  const list = data.filter((item) => item.title.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-card p-6 md:p-10">
        <div className="relative z-10 max-w-2xl space-y-3"><span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"><Film className="size-4" /> Catálogo de filmes</span><h1 className="text-3xl font-extrabold md:text-5xl">Filmes para assistir</h1><p className="text-sm leading-relaxed text-muted-foreground md:text-base">Descubra títulos, confira as informações do TMDB e abra o player na página do filme.</p><p className="text-xs text-muted-foreground">{list.length} títulos carregados · IDs atualizados pela RedeFlixApi</p></div>
      </section>
      <label className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 focus-within:ring-2 focus-within:ring-ring md:max-w-sm"><Search className="size-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar filme por título…" aria-label="Buscar filme" className="w-full bg-transparent text-sm outline-none" /></label>
      {list.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{list.map((item) => <CatalogCard key={item.id} item={item} to="/filme/$id" />)}</div> : <EmptyState title="Nenhum filme encontrado" text="Tente pesquisar por outro título." />}
    </div>
  );
}
