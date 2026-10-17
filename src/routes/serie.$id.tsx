import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import { fetchSeriesDetails } from "@/lib/catalog";
import { Player } from "@/components/mc/Player";
import { SafeImg, ErrorState } from "@/components/mc/ui";

const schema = { parse: (input: unknown) => ({ kind: (input as { kind?: string })?.kind === "anime" || (input as { kind?: string })?.kind === "dorama" ? (input as { kind: "anime" | "dorama" }).kind : "tv" as const }) };
const seriesQuery = (id: string, kind: "tv" | "anime" | "dorama") => ({ queryKey: ["catalog", "series-detail", id, kind], queryFn: () => fetchSeriesDetails({ data: { id, kind } }) });
export const Route = createFileRoute("/serie/$id")({
  validateSearch: schema,
  loader: ({ context, params, location }) => {
    const kind = new URLSearchParams(location.search).get("kind");
    return context.queryClient.ensureQueryData(seriesQuery(params.id, kind === "anime" || kind === "dorama" ? kind : "tv"));
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Série"} — Mega Canais TV` }, { name: "description", content: loaderData?.overview ?? "Veja temporadas e episódios no Mega Canais TV." }] }),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: SeriesPage,
});
function SeriesPage() {
  const { id } = Route.useParams();
  const { kind } = Route.useSearch();
  if (!/^\d+$/.test(id)) throw notFound();
  const validKind = kind === "anime" || kind === "dorama" ? kind : "tv";
  const { data } = useSuspenseQuery(seriesQuery(id, validKind));
  const seasons = data.seasons ?? {};
  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
  const [season, setSeason] = useState("1");
  const activeSeason = seasons[season] ? season : seasonKeys[0] ?? "1";
  const episodes = seasons[activeSeason] ?? {};
  const episodeKeys = Object.keys(episodes).sort((a, b) => Number(a) - Number(b));
  const [episode, setEpisode] = useState("1");
  const activeEpisode = episodes[episode] ? episode : episodeKeys[0] ?? "1";
  const playerUrl = episodes[activeEpisode] ?? `https://redeflixapi.store/serie/${id}/${activeSeason}/${activeEpisode}`;
  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <Link to="/series" search={{ kind: validKind === "tv" ? undefined : validKind }} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold hover:bg-accent"><ArrowLeft className="size-4" /> Voltar ao catálogo</Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4"><Player src={playerUrl} title={`${data.title} · T${activeSeason} E${activeEpisode}`} mode="on-demand" /><div><h1 className="text-2xl font-extrabold md:text-4xl">{data.title}</h1><div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">{data.year && <span className="inline-flex items-center gap-1"><Calendar className="size-4" /> {data.year}</span>}{typeof data.rating === "number" && <span className="inline-flex items-center gap-1"><Star className="size-4 text-yellow-400" /> {data.rating.toFixed(1)} / 10 no TMDB</span>}<span>ID TMDB: {data.id}</span></div>{data.overview && <p className="mt-3 leading-relaxed text-muted-foreground">{data.overview}</p>}</div></div>
        <aside className="space-y-4 rounded-xl border bg-card p-4"><div className="flex items-center gap-2"><SafeImg src={data.poster} alt="" className="h-20 w-14 rounded-md object-cover" /><div><h2 className="font-extrabold">Episódios</h2><p className="text-xs text-muted-foreground">{episodeKeys.length} disponíveis nesta temporada</p></div></div>
          <label className="block space-y-2 text-sm font-semibold">Temporada <span className="relative block"><select value={activeSeason} onChange={(e) => { setSeason(e.target.value); setEpisode("1"); }} className="h-11 w-full appearance-none rounded-lg border bg-background px-3 pr-9 outline-none focus:ring-2 focus:ring-ring">{(seasonKeys.length ? seasonKeys : ["1"]).map((key) => <option key={key} value={key}>Temporada {key}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4" /></span></label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3">{(episodeKeys.length ? episodeKeys : ["1"]).map((key) => <button key={key} onClick={() => setEpisode(key)} className={`min-h-11 rounded-lg border px-2 text-sm font-bold transition ${activeEpisode === key ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}>Ep. {key}</button>)}</div>
          {!episodeKeys.length && <p className="text-xs leading-relaxed text-muted-foreground">A lista de episódios não foi retornada. O player abre o episódio 1 como padrão; você pode escolher os números conhecidos.</p>}
        </aside>
      </div>
    </div>
  );
}
