import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Maximize, Minimize, RotateCw, TvMinimal } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { src?: string; title: string; onPrev?: () => void; onNext?: () => void };

const btn = "inline-flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-semibold transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none";

export function Player({ src, title, onPrev, onNext }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [fs, setFs] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(t);
  }, [src, nonce]);

  useEffect(() => {
    const onChange = () => setFs(document.fullscreenElement === wrap.current);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  const toggleFull = async () => {
    if (fs) return void document.exitFullscreen?.();
    if (expanded) return setExpanded(false);
    try {
      if (!document.fullscreenEnabled || !wrap.current?.requestFullscreen) throw new Error();
      await wrap.current.requestFullscreen();
    } catch {
      setExpanded(true); // fallback: in-page expanded mode
    }
  };
  const big = fs || expanded;

  return (
    <div ref={wrap} className={cn("flex flex-col bg-scrim", expanded && "fixed inset-0 z-50", !big && "overflow-hidden rounded-xl shadow-card")}>
      <div className={cn("relative w-full bg-scrim", big ? "flex-1" : "aspect-video")}>
        {src ? (
          <iframe
            key={`${src}-${nonce}`}
            src={src}
            title={`Player: ${title}`}
            className="absolute inset-0 size-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <TvMinimal className="size-10 text-muted-foreground" />
            <p className="font-semibold">Transmissão indisponível</p>
            <p className="text-sm text-muted-foreground">Este conteúdo não possui um endereço de player no momento.</p>
          </div>
        )}
        {src && loading && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-scrim/80">
            <Loader2 className="size-9 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando {title}…</span>
            {slow && (
              <button onClick={() => setNonce((n) => n + 1)} className={cn(btn, "pointer-events-auto")}>
                <RotateCw className="size-4" /> Está demorando. Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-card p-2">
        <span className="mr-auto flex items-center gap-2 truncate px-2 text-sm font-bold">
          <span className="live-dot size-2 rounded-full bg-live" /> {title}
        </span>
        {onPrev && <button className={btn} onClick={onPrev} aria-label="Canal anterior"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Anterior</span></button>}
        {onNext && <button className={btn} onClick={onNext} aria-label="Próximo canal"><span className="hidden sm:inline">Próximo</span><ChevronRight className="size-4" /></button>}
        <button className={btn} onClick={() => setNonce((n) => n + 1)} disabled={!src} aria-label="Recarregar player"><RotateCw className="size-4" /><span className="hidden sm:inline">Recarregar</span></button>
        <button className={btn} onClick={toggleFull} aria-label={big ? "Sair do modo ampliado" : "Ampliar player"}>
          {big ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          <span className="hidden sm:inline">{big ? "Sair" : "Ampliar"}</span>
        </button>
      </div>
    </div>
  );
}
