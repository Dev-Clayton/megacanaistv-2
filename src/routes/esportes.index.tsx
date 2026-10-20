import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { eventsQuery } from "@/lib/api";
import { EmptyState, ErrorState, EventCard, LoadingGrid } from "@/components/mc/ui";
import { eventStatus, type EventStatus } from "@/lib/time";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/esportes/")({
  head: () => ({
    meta: [
      { title: "Esportes ao vivo — Mega Canais TV" },
      { name: "description", content: "Agenda de jogos e eventos esportivos ao vivo, próximos e encerrados." },
      { property: "og:title", content: "Esportes ao vivo — Mega Canais TV" },
      { property: "og:description", content: "Confira os jogos ao vivo e a agenda de hoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sports,
});

const groups: { key: EventStatus; title: string }[] = [
  { key: "live", title: "Ao vivo agora" },
  { key: "upcoming", title: "Próximos eventos" },
  { key: "unknown", title: "Horário a confirmar" },
  { key: "ended", title: "Encerrados" },
];

function Sports() {
  const { data, isPending, isError, refetch } = useQuery(eventsQuery);
  const now = useNow();
  const [q, setQ] = useState("");
  const [league, setLeague] = useState("");

  const leagues = [...new Set((data ?? []).map((e) => e.league.name))].sort();
  const term = q.toLowerCase();
  const list = (data ?? [])
    .filter((e) => (!league || e.league.name === league) && e.title.toLowerCase().includes(term))
    .sort((a, b) => Date.parse(a.start ?? "") - Date.parse(b.start ?? ""));

  return (
    <div className="space-y-8 px-4 py-8 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Esportes</h1>
          <p className="text-sm text-muted-foreground">Futebol, tênis e outras modalidades, conforme a agenda do dia.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar confronto…" aria-label="Buscar confronto" className="h-11 rounded-full border bg-card px-5 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64" />
          <select value={league} onChange={(e) => setLeague(e.target.value)} aria-label="Filtrar por competição" className="h-11 rounded-full border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-60">
            <option value="">Todas as competições</option>
            {leagues.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {isPending || !now ? (
        <LoadingGrid count={8} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !list.length ? (
        <EmptyState title="Nenhum evento encontrado" text="Altere a busca ou a competição." />
      ) : (
        groups.map((g) => {
          const items = list.filter((e) => eventStatus(e, now) === g.key);
          if (!items.length) return null;
          return (
            <section key={g.key} className="space-y-3">
              <h2 className="text-xl font-bold">{g.title} <span className="text-sm font-semibold text-muted-foreground">({items.length})</span></h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(g.key === "ended" ? [...items].reverse() : items).map((e) => <EventCard key={e.id} event={e} now={now} />)}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
