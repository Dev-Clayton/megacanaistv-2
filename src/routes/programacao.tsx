import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Clock3, Search } from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(channelsQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: Guide,
});

function getProgress(start: string, end: string | undefined, now: number) {
  const startMs = Date.parse(start);
  const endMs = end ? Date.parse(end) : startMs + 3 * 60 * 60 * 1000;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return Math.max(0, Math.min(100, ((now - startMs) / (endMs - startMs)) * 100));
}

function Guide() {
  const { data } = useSuspenseQuery(channelsQuery);
  const epg = useQuery(epgQuery);
  const now = useNow();
  const [q, setQ] = useState("");
  const term = q.trim().toLocaleLowerCase("pt-BR");

  const rows = data.channels
    .map((c) => ({ c, w: epg.data?.[c.id] && now ? programWindow(epg.data[c.id]!, now, 3) : undefined }))
    .filter(({ c, w }) => w && (w.current || w.upcoming.length))
    .filter(({ c, w }) => !term || c.name.toLocaleLowerCase("pt-BR").includes(term) || [w!.current, ...w!.upcoming].some((p) => p?.title.toLocaleLowerCase("pt-BR").includes(term)));

  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Clock3 className="size-3.5" /> Guia de TV
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">Programação</h1>
          <p className="text-sm text-muted-foreground">O que está passando agora e o que vem a seguir · Horários de Brasília</p>
        </div>
        <label className="relative block w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar canal ou programa…" aria-label="Buscar canal ou programa" className="h-12 w-full rounded-full border border-input bg-card pl-11 pr-5 text-sm outline-none transition focus:ring-2 focus:ring-ring" />
        </label>
      </header>

      {!epg.isPending && !epg.isError && now && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Canais com programação disponível</span>
          <span className="font-bold tabular-nums">{rows.length} canais</span>
        </div>
      )}

      {epg.isPending || !now ? (
        <LoadingGrid count={6} />
      ) : epg.isError ? (
        <ErrorState onRetry={() => epg.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="Nada encontrado" text="Nenhum canal ou programa corresponde à busca." />
      ) : (
        <ul className="space-y-3">
          {rows.map(({ c, w }) => {
            const current = w!.current;
            const progress = current ? getProgress(current.start, w!.currentEnd, now) : 0;
            return (
              <li key={c.id}>
                <Link
                  to="/canal/$id"
                  params={{ id: c.id }}
                  className="group grid gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/60 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring md:grid-cols-[190px_minmax(0,1fr)] md:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3 md:items-start">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface p-2">
                      <SafeImg src={c.image} alt={c.name} className="max-h-full max-w-full object-contain" fallback={null} />
                    </div>
                    <div className="min-w-0 self-center md:pt-1">
                      <div className="truncate font-bold">{c.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{current ? "No ar agora" : "Próximas atrações"}</div>
                      <div className="mt-2 text-xs font-semibold text-primary">Assistir canal ↗</div>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3">
                    {current ? (
                      <section aria-label={`Programa atual: ${current.title}`} className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                            <span className="size-2 rounded-full bg-live" /> Ao vivo
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {formatTime(current.start)} – {formatTime(w!.currentEnd)}
                          </span>
                        </div>
                        <h2 className="truncate text-base font-bold md:text-lg">{current.title}</h2>
                        <div
                          className="mt-3 h-2 overflow-hidden rounded-full bg-surface"
                          role="progressbar"
                          aria-label={`Progresso de ${current.title}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(progress)}
                        >
                          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="mt-1 flex justify-end text-[11px] text-muted-foreground">{Math.round(progress)}% exibido</div>
                      </section>
                    ) : (
                      <div className="rounded-xl bg-surface px-3 py-3 text-sm text-muted-foreground">Nenhum programa identificado neste momento.</div>
                    )}

                    {w!.upcoming.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {w!.upcoming.slice(0, 2).map((p) => (
                          <div key={p.start} className="min-w-0 rounded-xl border border-border/70 px-3 py-2.5">
                            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{formatTime(p.start)} · A seguir</div>
                            <div className="truncate text-sm font-semibold">{p.title}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
