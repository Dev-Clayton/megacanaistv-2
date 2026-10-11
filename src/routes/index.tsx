import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Play, Radio } from "lucide-react";
import { channelsQuery, eventsQuery } from "@/lib/api";
import { Carousel, carouselItem, ChannelCard, ErrorState, EventCard, SafeImg } from "@/components/mc/ui";
import { eventStatus } from "@/lib/time";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mega Canais TV — Canais ao vivo, esportes e programação" },
      { name: "description", content: "Assista canais ao vivo por categoria, acompanhe jogos e veja a programação na Mega Canais TV." },
      { property: "og:title", content: "Mega Canais TV" },
      { property: "og:description", content: "Canais ao vivo, esportes e programação em um só lugar." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(channelsQuery),
  errorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(channelsQuery);
  const events = useQuery(eventsQuery);
  const now = useNow();
  const withPreview = data.channels.filter((c) => c.preview);
  const hero = withPreview[0] ?? data.channels[0];
  const featured = (withPreview.length >= 6 ? withPreview : data.channels).slice(0, 14);
  const live = (events.data ?? []).filter((e) => now && eventStatus(e, now) !== "ended").slice(0, 12);

  return (
    <div className="space-y-10 pb-6">
      {hero && (
        <section className="relative isolate flex min-h-[62vh] items-end overflow-hidden md:min-h-[72vh]">
          <SafeImg src={hero.preview ?? hero.image} alt="" className="absolute inset-0 -z-10 size-full object-cover" fallback={<div className="absolute inset-0 -z-10 bg-card" />} />
          <div className="absolute inset-0 -z-10 bg-hero-fade" />
          <div className="max-w-xl space-y-5 px-4 pb-12 md:px-10 md:pb-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-live px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Radio className="size-3.5" /> No ar agora
            </span>
            <SafeImg src={hero.image} alt={hero.name} className="h-16 max-w-56 object-contain object-left" fallback={null} />
            <h1 className="text-4xl font-extrabold md:text-6xl">{hero.name}</h1>
            <p className="text-muted-foreground md:text-lg">
              {data.channels.length} canais ao vivo em {data.categories.length - 1} categorias. Escolha, aperte o play e pronto.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/canal/$id" params={{ id: hero.id }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition hover:brightness-110">
                <Play className="size-5 fill-current" /> Assistir
              </Link>
              <Link to="/canais" className="inline-flex items-center rounded-full bg-secondary px-6 py-3 font-bold transition hover:bg-accent">
                Ver todos os canais
              </Link>
            </div>
          </div>
        </section>
      )}

      {live.length > 0 && (
        <Carousel title="Esportes ao vivo e a seguir" to={<Link to="/esportes" className="text-sm font-semibold text-primary">Ver agenda</Link>}>
          {live.map((e) => <EventCard key={e.id} event={e} now={now} className="w-72 shrink-0 snap-start" />)}
        </Carousel>
      )}

      <Carousel title="Canais em destaque">
        {featured.map((c) => <ChannelCard key={c.id} channel={c} className={carouselItem} />)}
      </Carousel>

      {data.categories.filter((cat) => cat.id !== 0).map((cat) => {
        const list = data.channels.filter((c) => c.categories.includes(cat.id));
        if (!list.length) return null;
        return (
          <Carousel key={cat.id} title={cat.name} to={<Link to="/canais" search={{ cat: cat.id }} className="text-sm font-semibold text-primary">Ver tudo</Link>}>
            {list.map((c) => <ChannelCard key={c.id} channel={c} className={carouselItem} />)}
          </Carousel>
        );
      })}
    </div>
  );
}
