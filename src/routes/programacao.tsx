import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { channelsQuery, epgQuery } from "@/lib/api";
import { EmptyState, ErrorState, LoadingGrid, SafeImg } from "@/components/mc/ui";
import { formatTime, programWindow } from "@/lib/time";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/programacao")({
  head: () => ({
    meta: [
      { title: "Programação de hoje — Mega Canais TV" },
      { name: "description", content: "Veja o que está passando agora e os próximos programas de cada canal." },
      { property: "og:title", content: "Programação — Mega Canais TV" },
      { property: "og:description", content: "O que está passando agora em cada canal." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(channelsQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: Guide,
});

function Guide() {
  const { data } = useSuspenseQuery(channelsQuery);
  const epg = useQuery(epgQuery);
  const now = useNow();
  const [q, setQ] = useState("");
  const term = q.toLowerCase();

  const rows = data.channels
    .map((c) => ({ c, w: epg.data?.[c.id] && now ? programWindow(epg.data[c.id], now, 3) : undefined }))
    .filter(({ c, w }) => w && (w.current || w.upcoming.length))
    .filter(({ c, w }) => !term || c.name.toLowerCase().includes(term) || [w!.current, ...w!.upcoming].some((p) => p?.title.toLowerCase().includes(term)));

  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Programação</h1>
          <p className="text-sm text-muted-foreground">Horários de Brasília.</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar canal ou programa…" aria-label="Buscar canal ou programa" className="h-11 w-full rounded-full border bg-card px-5 text-sm outline-none focus:ring-2 focus:ring-ring md:w-80" />
      </div>
      {epg.isPending || !now ? (
        <LoadingGrid count={6} />
      ) : epg.isError ? (
        <ErrorState onRetry={() => epg.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="Nada encontrado" text="Nenhum canal ou programa corresponde à busca." />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ c, w }) => (
            <li key={c.id}>
              <Link to="/canal/$id" params={{ id: c.id }} className="grid gap-3 rounded-xl border bg-card p-3 transition hover:bg-accent md:grid-cols-[180px_1fr_1fr_1fr] md:items-center">
                <div className="flex items-center gap-3">
                  <SafeImg src={c.image} alt="" className="h-10 w-14 rounded-md bg-surface object-contain p-1" />
                  <span className="font-bold">{c.name}</span>
                </div>
                {w!.current ? (
                  <div className="rounded-lg bg-primary/15 p-2 ring-1 ring-primary">
                    <div className="text-xs font-bold text-primary">AGORA · {formatTime(w!.current.start)}</div>
                    <div className="truncate text-sm font-semibold">{w!.current.title}</div>
                  </div>
                ) : <div className="text-sm text-muted-foreground">—</div>}
                {w!.upcoming.slice(0, 2).map((p) => (
                  <div key={p.start} className="hidden rounded-lg bg-surface p-2 md:block">
                    <div className="text-xs font-bold text-muted-foreground">{formatTime(p.start)}</div>
                    <div className="truncate text-sm font-semibold">{p.title}</div>
                  </div>
                ))}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
