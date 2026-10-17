import { Link } from "@tanstack/react-router";
import { Star, Play } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";
import { SafeImg } from "@/components/mc/ui";

export function CatalogCard({ item, to, search }: { item: CatalogItem; to: "/filme/$id" | "/serie/$id"; search?: { kind?: string } }) {
  const poster = item.poster;
  return (
    <Link to={to} params={{ id: item.id }} search={search as never} className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-ring">
      <div className="relative aspect-[2/3] overflow-hidden bg-surface">
        <SafeImg src={poster} alt={item.title} className="size-full object-cover transition duration-300 group-hover:scale-105" fallback={<div className="grid size-full place-items-center p-4 text-center text-sm font-bold text-muted-foreground">{item.title}</div>} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"><Play className="size-3 fill-current" /> Assistir</span>
        {typeof item.rating === "number" && item.rating > 0 && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-xs font-bold text-white"><Star className="size-3 fill-current text-yellow-400" /> {item.rating.toFixed(1)}</span>}
      </div>
      <div className="space-y-1 p-3"><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-snug">{item.title}</h3><p className="text-xs text-muted-foreground">{item.year ?? "Catálogo TMDB"} · TMDB</p></div>
    </Link>
  );
}
