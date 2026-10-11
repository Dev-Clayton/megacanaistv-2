import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RotateCw, Tv } from "lucide-react";
import { useRef } from "react";
import type { Channel, SportEvent } from "@/lib/types";
import { eventStatus, formatDay, formatTime, type EventStatus } from "@/lib/time";
import { cn } from "@/lib/utils";

export function SafeImg({ src, alt, className, fallback }: { src?: string; alt: string; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return <>{fallback ?? <div className={cn("flex items-center justify-center bg-surface text-muted-foreground", className)}><Tv className="size-1/3 max-w-10" /></div>}</>;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} />;
}

export function ChannelCard({ channel, className }: { channel: Channel; className?: string }) {
  return (
    <Link
      to="/canal/$id"
      params={{ id: channel.id }}
      className={cn(
        "group block overflow-hidden rounded-xl bg-card shadow-card outline-none transition duration-300 hover:-translate-y-1 hover:shadow-glow focus-visible:shadow-glow",
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        <SafeImg
          src={channel.preview ?? channel.image}
          alt={channel.name}
          className={cn("size-full transition duration-500 group-hover:scale-105", channel.preview ? "object-cover" : "object-contain p-6")}
          fallback={<SafeImg src={channel.image} alt={channel.name} className="size-full object-contain p-6" />}
        />
        {channel.preview && channel.image && (
          <div className="absolute bottom-2 left-2 rounded-md bg-scrim/80 p-1 backdrop-blur">
            <SafeImg src={channel.image} alt="" className="h-6 w-10 object-contain" fallback={null} />
          </div>
        )}
      </div>
      <div className="truncate px-3 py-2.5 text-sm font-semibold">{channel.name}</div>
    </Link>
  );
}

export function Carousel({ title, to, children }: { title: string; to?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-end justify-between gap-4 px-4 md:px-10">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
        {to}
      </div>
      <div className="relative">
        <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4 pt-1 md:scroll-px-10 md:gap-4 md:px-10">
          {children}
        </div>
        {(["left", "right"] as const).map((side) => (
          <button
            key={side}
            aria-label={side === "left" ? "Anterior" : "Próximo"}
            onClick={() => scroll(side === "left" ? -1 : 1)}
            className={cn(
              "absolute top-1 bottom-4 z-10 hidden w-10 items-center justify-center bg-scrim/70 opacity-0 transition group-hover/row:opacity-100 focus-visible:opacity-100 md:flex",
              side === "left" ? "left-0 rounded-r-lg" : "right-0 rounded-l-lg",
            )}
          >
            {side === "left" ? <ChevronLeft /> : <ChevronRight />}
          </button>
        ))}
      </div>
    </section>
  );
}

export const carouselItem = "w-[46vw] shrink-0 snap-start sm:w-[30vw] md:w-[22vw] lg:w-[17vw] xl:w-[15vw]";

export function StatusBadge({ status }: { status: EventStatus }) {
  const map = {
    live: ["Ao vivo", "bg-live text-foreground"],
    upcoming: ["Em breve", "bg-secondary text-secondary-foreground"],
    ended: ["Encerrado", "bg-muted text-muted-foreground"],
    unknown: ["Horário a confirmar", "bg-muted text-muted-foreground"],
  } as const;
  const [label, cls] = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", cls)}>
      {status === "live" && <span className="live-dot size-1.5 rounded-full bg-foreground" />}
      {label}
    </span>
  );
}

function TeamBadge({ team }: { team: SportEvent["home"] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <SafeImg src={team.image} alt={team.name} className="size-12 rounded-full bg-surface object-contain p-1.5" />
      <span className="line-clamp-2 text-xs font-semibold">{team.name}</span>
    </div>
  );
}

export function EventCard({ event, now, className }: { event: SportEvent; now: number; className?: string }) {
  return (
    <Link
      to="/esportes/$slug"
      params={{ slug: event.slug }}
      className={cn("block rounded-xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow focus-visible:shadow-glow outline-none", className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <SafeImg src={event.league.image} alt="" className="size-4 object-contain" fallback={null} />
          <span className="truncate">{event.league.name}</span>
        </div>
        <StatusBadge status={eventStatus(event, now)} />
      </div>
      <div className="flex items-start gap-2">
        <TeamBadge team={event.home} />
        <div className="pt-3 text-center">
          <div className="font-display text-lg font-bold">{formatTime(event.start)}</div>
          <div className="text-[11px] capitalize text-muted-foreground">{formatDay(event.start)}</div>
        </div>
        <TeamBadge team={event.away} />
      </div>
    </Link>
  );
}

export function LoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="aspect-[16/11] animate-pulse rounded-xl bg-card" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <AlertTriangle className="size-10 text-primary" />
      <h2 className="text-xl font-bold">Não foi possível carregar</h2>
      <p className="text-sm text-muted-foreground">{message ?? "Verifique sua conexão e tente novamente."}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
          <RotateCw className="size-4" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <Inbox className="size-10 text-muted-foreground" />
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
