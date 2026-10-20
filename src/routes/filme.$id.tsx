import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Star } from "lucide-react";
import { fetchMovieDetails } from "@/lib/catalog";
import { Player } from "@/components/mc/Player";
import { SafeImg, ErrorState } from "@/components/mc/ui";

const movieQuery = (id: string) => ({ queryKey: ["catalog", "movie", id], queryFn: () => fetchMovieDetails({ data: { id } }) });
export const Route = createFileRoute("/filme/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(movieQuery(params.id)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Filme"} — Mega Canais TV` }, { name: "description", content: loaderData?.overview ?? "Assista ao filme no Mega Canais TV." }, { property: "og:title", content: `${loaderData?.title ?? "Filme"} — Mega Canais TV` }, { property: "og:description", content: loaderData?.overview ?? "Assista ao filme no Mega Canais TV." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: MoviePage,
});
function MoviePage() {
  const { id } = Route.useParams();
  if (!/^\d+$/.test(id)) throw notFound();
  const { data } = useSuspenseQuery(movieQuery(id));
  return (
    <div className="space-y-8 px-4 py-8 md:px-10">
      <Link to="/filmes" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold hover:bg-accent"><ArrowLeft className="size-4" /> Voltar aos filmes</Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4"><Player src={data.playerUrl} title={data.title} mode="on-demand" /><div><h1 className="text-2xl font-extrabold md:text-4xl">{data.title}</h1><div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">{data.year && <span className="inline-flex items-center gap-1"><Calendar className="size-4" /> {data.year}</span>}{typeof data.rating === "number" && <span className="inline-flex items-center gap-1"><Star className="size-4 text-yellow-400" /> {data.rating.toFixed(1)} / 10 no TMDB</span>}<span>ID TMDB: {data.id}</span></div>{data.overview && <p className="mt-4 max-w-4xl leading-relaxed text-muted-foreground">{data.overview}</p>}</div></div>
        <aside className="space-y-4 rounded-xl border bg-card p-4"><SafeImg src={data.poster} alt={data.title} className="mx-auto max-h-[430px] w-full rounded-lg object-cover" fallback={<div className="grid aspect-[2/3] place-items-center rounded-lg bg-surface p-6 text-center font-bold">{data.title}</div>} /><p className="text-xs text-muted-foreground">Informações de catálogo fornecidas pelo TMDB quando a chave da API estiver configurada.</p></aside>
      </div>
    </div>
  );
}
