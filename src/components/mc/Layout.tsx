import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Search, Trophy, TvMinimal } from "lucide-react";

const nav = [
  { to: "/", label: "Início", icon: TvMinimal },
  { to: "/canais", label: "Canais", icon: TvMinimal },
  { to: "/esportes", label: "Esportes", icon: Trophy },
  { to: "/programacao", label: "Programação", icon: CalendarDays },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-extrabold tracking-tight" aria-label="Mega Canais TV — início">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-primary-foreground shadow-card"><TvMinimal className="size-5" strokeWidth={2.4} /></span>
      <span>Mega<span className="text-brand">Canais</span><span className="ml-1 text-xs font-bold text-muted-foreground">TV</span></span>
    </Link>
  );
}

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:gap-4 md:px-6 xl:px-10">
        <Logo />
        <nav className="hidden min-w-0 items-center gap-1 lg:flex" aria-label="Principal">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" activeProps={{ className: "bg-secondary text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <form
          role="search"
          className="ml-auto flex h-10 min-w-0 w-32 shrink items-center gap-2 rounded-full border bg-card px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring sm:w-52 lg:w-56 xl:w-64"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate({ to: "/busca", search: { q: q.trim() } });
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar canais" aria-label="Buscar" className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </form>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Principal móvel">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" activeProps={{ className: "bg-secondary text-foreground" }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t px-4 py-10 md:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">Canais ao vivo, esportes e programação em um só lugar.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-foreground">{n.label}</Link>)}
        </nav>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} Mega Canais TV. Conteúdo fornecido por terceiros.</p>
    </footer>
  );
}
