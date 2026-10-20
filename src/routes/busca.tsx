import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { channelsQuery, eventsQuery } from "@/lib/api";
import { ChannelCard, EmptyState, ErrorState, EventCard } from "@/components/mc/ui";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/busca")({
  validateSearch: z.object({ q: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Buscar — Mega Canais TV" },
      { name: "description", content: "Encontre canais e eventos esportivos na Mega Canais TV." },
      { property: "og:title", content: "Buscar — Mega Canais TV" },
      { property: "og:description", content: "Busque canais e jogos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(channelsQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data } = useSuspenseQuery(channelsQuery);
  const events = useQuery(eventsQuery);
  const now = useNow();
  const t = q.toLowerCase().trim();
  const channels = t ? data.channels.filter((c) => c.name.toLowerCase().includes(t)) : [];
  const evs = t ? (events.data ?? []).filter((e) => `${e.title} ${e.league.name}`.toLowerCase().includes(t)) : [];

  return (
    <div className="space-y-8 px-4 py-8 md:px-10">
      <h1 className="text-3xl font-extrabold">Resultados para “{q}”</h1>
      {!channels.length && !evs.length && !events.isPending && <EmptyState title="Nada encontrado" text="Tente outro termo." />}
      {channels.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Canais</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {channels.map((c) => <ChannelCard key={c.id} channel={c} />)}
          </div>
        </section>
      )}
      {evs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Eventos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {evs.map((e) => <EventCard key={e.id} event={e} now={now} />)}
          </div>
        </section>
      )}
    </div>
  );
}
