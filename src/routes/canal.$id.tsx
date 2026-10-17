import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { channelsQuery, epgQuery } from "@/lib/api";
import { Player } from "@/components/mc/Player";
import { Carousel, carouselItem, ChannelCard, EmptyState, ErrorState, SafeImg } from "@/components/mc/ui";
import { formatTime, programWindow, LAST_PROGRAM_MAX_MS } from "@/lib/time";
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

  const currentStartMs = current ? Date.parse(current.start) : 0;
  const currentEndMs = currentEnd ? Date.parse(currentEnd) : currentStartMs + LAST_PROGRAM_MAX_MS;
  const validWindow = Boolean(current && Number.isFinite(currentStartMs) && Number.isFinite(currentEndMs) && currentEndMs > currentStartMs);
  const progress = validWindow
    ? Math.max(0, Math.min(100, ((now - currentStartMs) / (currentEndMs - currentStartMs)) * 100))
    : 0;
  const remainingMinutes = validWindow ? Math.max(0, Math.ceil((currentEndMs - now) / 60000)) : null;

  return (
    <div className="space-y-4">
      {current && (
        <section className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-4" aria-label="Programa atual">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-live" />
              </span>
              No ar agora
            </span>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
              {formatTime(current.start)} – {currentEnd ? formatTime(currentEnd) : "—"}
            </span>
          </div>
          <h3 className="text-base font-extrabold leading-snug md:text-lg">{current.title}</h3>
          {current.desc && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{current.desc}</p>}
          <div className="mt-4">
            <div
              className="h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label={`Progresso de ${current.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
              <span>{Math.round(progress)}% exibido</span>
              {remainingMinutes !== null && <span>Termina em cerca de {remainingMinutes} min</span>}
            </div>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-label="Próximos programas">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold">A seguir</h3>
            <span className="text-xs text-muted-foreground">{upcoming.length} na lista</span>
          </div>
          <ol className="max-h-[390px] space-y-2 overflow-y-auto pr-1">
            {upcoming.map((p, i) => (
              <li key={p.start + p.title} className="group relative rounded-lg border border-transparent bg-surface p-3 transition-colors hover:border-border hover:bg-accent/50">
                <div className="flex items-start gap-3">
                  <div className="min-w-[54px] rounded-md bg-background px-2 py-2 text-center">
                    <span className="text-sm font-extrabold tabular-nums">{formatTime(p.start)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug">{p.title}</h4>
                      {i === 0 && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Próximo</span>}
                    </div>
                    {p.desc && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!current && upcoming.length > 0 && (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">O programa atual não foi identificado pela grade. Confira os próximos horários abaixo.</p>
      )}
    </div>
  );
}
