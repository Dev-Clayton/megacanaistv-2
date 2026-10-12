import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { channelsQuery, epgQuery } from "@/lib/api";
import { Player } from "@/components/mc/Player";
import { Carousel, carouselItem, ChannelCard, EmptyState, ErrorState, SafeImg } from "@/components/mc/ui";
import { formatTime, programWindow } from "@/lib/time";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/canal/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(channelsQuery);
    const channel = data.channels.find((c) => c.id === params.id);
    if (!channel) throw notFound();
    return { name: channel.name, image: channel.image };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.name} ao vivo — Mega Canais TV` },
            { name: "description", content: `Assista ${loaderData.name} ao vivo e veja a programação na Mega Canais TV.` },
            { property: "og:title", content: `${loaderData.name} ao vivo — Mega Canais TV` },
            { property: "og:description", content: `Assista ${loaderData.name} ao vivo.` },
          ],
        }
      : { meta: [{ title: "Canal não encontrado — Mega Canais TV" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => (
    <div className="py-10 text-center">
      <EmptyState title="Canal não encontrado" text="Este canal não está mais disponível." />
      <Link to="/canais" className="font-semibold text-primary">Ver todos os canais</Link>
    </div>
  ),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: ChannelPage,
});

function ChannelPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(channelsQuery);
  const epg = useQuery(epgQuery);
  const navigate = useNavigate();
  const router = useRouter();
  const now = useNow();
  const idx = data.channels.findIndex((c) => c.id === id);
  const channel = data.channels[idx];
  if (!channel) return null;
  const go = (i: number) => {
    const n = data.channels.length;
    navigate({ to: "/canal/$id", params: { id: data.channels[(i + n) % n]!.id } });
  };
  const cats = data.categories.filter((c) => c.id !== 0 && channel.categories.includes(c.id));
  const related = data.channels.filter((c) => c.id !== channel.id && c.categories.some((x) => x !== 0 && channel.categories.includes(x))).slice(0, 20);
  const programs = epg.data?.[channel.id];

  return (
    <div className="space-y-10 py-6">
      <div className="grid gap-6 px-4 md:px-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => (window.history.length > 1 ? router.history.back() : navigate({ to: "/canais" }))} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold hover:bg-accent">
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <select
              value={channel.id}
              onChange={(e) => navigate({ to: "/canal/$id", params: { id: e.target.value } })}
              aria-label="Mudar de canal"
              className="ml-auto h-10 max-w-60 rounded-full border bg-card px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
            >
              {data.channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Player src={channel.url} title={channel.name} onPrev={() => go(idx - 1)} onNext={() => go(idx + 1)} />
          <div className="flex items-center gap-4">
            <SafeImg src={channel.image} alt={channel.name} className="h-14 w-20 rounded-lg bg-card object-contain p-2" />
            <div>
              <h1 className="text-2xl font-extrabold md:text-3xl">{channel.name}</h1>
              <div className="mt-1 flex flex-wrap gap-2">
                {cats.map((c) => (
                  <Link key={c.id} to="/canais" search={{ cat: c.id }} className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold hover:bg-accent">{c.name}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-4" aria-label="Programação">
          <h2 className="mb-3 text-lg font-bold">Programação</h2>
          {epg.isPending ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-surface" />)}</div>
          ) : epg.isError ? (
            <ErrorState message="Não foi possível carregar a programação." onRetry={() => epg.refetch()} />
          ) : !programs?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Programação indisponível</p>
          ) : (
            <Schedule programs={programs} now={now} />
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <Carousel title="Canais relacionados">
          {related.map((c) => <ChannelCard key={c.id} channel={c} className={carouselItem} />)}
        </Carousel>
      )}
    </div>
  );
}

function Schedule({ programs, now }: { programs: NonNullable<ReturnType<typeof programWindow>["upcoming"]>; now: number }) {
  if (!now) return null;
  const { current, currentEnd, upcoming } = programWindow(programs, now, 10);
  const items = [...(current ? [current] : []), ...upcoming];
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">Sem programas futuros informados.</p>;
  return (
    <ol className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
      {items.map((p, i) => {
        const isNow = current && i === 0;
        return (
          <li key={p.start + p.title} className={cn("rounded-lg p-3", isNow ? "bg-primary/15 ring-1 ring-primary" : "bg-surface")}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={isNow ? "text-primary" : "text-muted-foreground"}>
                {formatTime(p.start)}{isNow && currentEnd ? ` – ${formatTime(currentEnd)}` : ""}
              </span>
              {isNow && <span className="rounded-full bg-live px-2 py-0.5 text-[10px] uppercase">Agora</span>}
            </div>
            <div className="mt-1 font-semibold">{p.title}</div>
            {p.desc && <p className={cn("mt-1 text-sm text-muted-foreground", !isNow && "line-clamp-2")}>{p.desc}</p>}
          </li>
        );
      })}
    </ol>
  );
}
