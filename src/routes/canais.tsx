import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { channelsQuery } from "@/lib/api";
import { ChannelCard, EmptyState, ErrorState } from "@/components/mc/ui";
import { cn } from "@/lib/utils";

const schema = z.object({ cat: z.coerce.number().optional().catch(undefined), q: z.string().optional().catch(undefined) });

export const Route = createFileRoute("/canais")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "Canais ao vivo — Mega Canais TV" },
      { name: "description", content: "Todos os canais da Mega Canais TV por categoria: esportes, filmes, notícias, infantil e mais." },
      { property: "og:title", content: "Canais ao vivo — Mega Canais TV" },
      { property: "og:description", content: "Navegue por categoria e encontre seu canal." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(channelsQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: Channels,
});

function Channels() {
  const { data } = useSuspenseQuery(channelsQuery);
  const { cat = 0, q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/canais" });
  const term = q.toLowerCase();
  const list = data.channels.filter((c) => (cat === 0 || c.categories.includes(cat)) && c.name.toLowerCase().includes(term));

  return (
    <div className="space-y-6 px-4 py-8 md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Canais</h1>
          <p className="text-sm text-muted-foreground">{list.length} canais</p>
        </div>
        <input
          value={q}
          onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }), replace: true })}
          placeholder="Filtrar por nome…"
          aria-label="Filtrar canais por nome"
          className="h-11 w-full rounded-full border bg-card px-5 text-sm outline-none focus:ring-2 focus:ring-ring md:w-80"
        />
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="tablist">
        {data.categories.map((c) => (
          <Link
            key={c.id}
            to="/canais"
            search={(s) => ({ ...s, cat: c.id === 0 ? undefined : c.id })}
            role="tab"
            aria-selected={cat === c.id}
            className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition", cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {list.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((c) => <ChannelCard key={c.id} channel={c} />)}
        </div>
      ) : (
        <EmptyState title="Nenhum canal encontrado" text="Tente outro nome ou categoria." />
      )}
    </div>
  );
}
