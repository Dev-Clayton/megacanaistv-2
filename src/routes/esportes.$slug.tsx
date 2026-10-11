import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { eventsQuery } from "@/lib/api";
import { Player } from "@/components/mc/Player";
import { EmptyState, ErrorState, EventCard, SafeImg, StatusBadge } from "@/components/mc/ui";
import { eventStatus, formatDay, formatTime } from "@/lib/time";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/esportes/$slug")({
  loader: async ({ context, params }) => {
    const events = await context.queryClient.ensureQueryData(eventsQuery);
    const ev = events.find((e) => e.slug === params.slug) ?? events.find((e) => e.id === params.slug);
    if (!ev) throw notFound();
    return { title: ev.title, league: ev.league.name };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} — Mega Canais TV` },
            { name: "description", content: `${loaderData.title} pela ${loaderData.league}: assista ao vivo na Mega Canais TV.` },
            { property: "og:title", content: `${loaderData.title} — Mega Canais TV` },
            { property: "og:description", content: `${loaderData.league} ao vivo.` },
          ],
        }
      : { meta: [{ title: "Evento indisponível — Mega Canais TV" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => (
    <div className="py-10 text-center">
      <EmptyState title="Evento não encontrado" text="Ele pode ter saído da agenda." />
      <Link to="/esportes" className="font-semibold text-primary">Ver agenda de esportes</Link>
    </div>
  ),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: EventPage,
});

function EventPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(eventsQuery);
  const now = useNow();
  const [src, setSrc] = useState(0);
  const ev = data.find((e) => e.slug === slug) ?? data.find((e) => e.id === slug);
  if (!ev) return null;
  const related = data.filter((e) => e.id !== ev.id && e.league.name === ev.league.name).concat(data.filter((e) => e.id !== ev.id && e.league.name !== ev.league.name && now && eventStatus(e, now) === "live")).slice(0, 8);
  const player = ev.players[Math.min(src, ev.players.length - 1)];

  return (
    <div className="space-y-10 px-4 py-6 md:px-10">
      <Link to="/esportes" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold hover:bg-accent">
        <ArrowLeft className="size-4" /> Agenda
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Player key={ev.id} src={player} title={ev.title} />
          {ev.players.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Transmissões">
              {ev.players.map((_, i) => (
                <button key={i} onClick={() => setSrc(i)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", i === src ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                  Opção {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-5 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SafeImg src={ev.league.image} alt="" className="size-5 object-contain" fallback={null} />
            {ev.league.name}
          </div>
          <h1 className="text-2xl font-extrabold">{ev.title}</h1>
          <div className="flex items-center justify-around gap-3">
            {[ev.home, ev.away].map((t, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2 text-center">
                <SafeImg src={t.image} alt={t.name} className="size-16 rounded-full bg-surface object-contain p-2" />
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            {now > 0 && <StatusBadge status={eventStatus(ev, now)} />}
            <p className="capitalize text-muted-foreground">{formatDay(ev.start)}</p>
            <p>Início <b>{formatTime(ev.start)}</b> · Término <b>{formatTime(ev.end)}</b></p>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Outros eventos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((e) => <EventCard key={e.id} event={e} now={now} />)}
          </div>
        </section>
      )}
    </div>
  );
}
