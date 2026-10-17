import { useEffect, useRef, useState } from "react";
import { Cast, ChevronLeft, ChevronRight, Maximize, Minimize, PlayCircle, RotateCw, TvMinimal, Unlock, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { src?: string | undefined; title: string; onPrev?: () => void; onNext?: () => void; mode?: "live" | "on-demand" };

type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type LegacyFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-sm font-semibold transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring";

export function Player({ src, title, onPrev, onNext, mode = "live" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [nonce, setNonce] = useState(0);
  const [fs, setFs] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showCastHelp, setShowCastHelp] = useState(false);

  useEffect(() => {
    setUnlocked(false);
    setShowCastHelp(false);
  }, [src]);

  const unlock = () => {
    if (src) window.open(src, "_blank", "noopener,noreferrer");
    setUnlocked(true);
  };

  useEffect(() => {
    const legacyDoc = document as LegacyFullscreenDocument;
    const onChange = () => {
      setFs((document.fullscreenElement ?? legacyDoc.webkitFullscreenElement) === wrap.current);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showCastHelp) setShowCastHelp(false);
      else if (expanded) setExpanded(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, showCastHelp]);

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  const toggleFull = async () => {
    const legacyDoc = document as LegacyFullscreenDocument;
    if (fs) {
      const exit = document.exitFullscreen ?? legacyDoc.webkitExitFullscreen;
      if (exit) {
        try { await exit.call(document); } catch { setExpanded(false); }
      } else {
        setExpanded(false);
      }
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    const element = wrap.current as LegacyFullscreenElement | null;
    const request = element?.requestFullscreen ?? element?.webkitRequestFullscreen;
    const fullscreenEnabled = document.fullscreenEnabled || legacyDoc.webkitFullscreenEnabled || !!request;
    try {
      if (!fullscreenEnabled || !request || !element) throw new Error("Fullscreen API indisponível");
      await request.call(element);
    } catch {
      // Fallback sem API de tela cheia: amplia o player dentro da página.
      setExpanded(true);
    }
  };

  const big = fs || expanded;

  return (
    <div ref={wrap} className={cn("flex flex-col bg-scrim", expanded && "fixed inset-0 z-50", !big && "overflow-hidden rounded-xl shadow-card")}>
      <div className={cn("relative w-full bg-scrim", big ? "flex-1" : "aspect-video")}>
        {src && !unlocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-scrim p-6 text-center">
            <TvMinimal className="size-12 text-primary" />
            <p className="text-lg font-bold">{mode === "live" ? `Assista ${title} ao vivo` : `Assista ${title}`}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Para liberar o player, clique no botão abaixo. Um link será aberto em uma nova aba e o conteúdo será liberado aqui.
            </p>
            <button onClick={unlock} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground shadow-glow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring">
              <Unlock className="size-5" /> Liberar acesso
            </button>
          </div>
        ) : src ? (
          <iframe
            key={`${src}-${nonce}`}
            src={src}
            title={`Player: ${title}`}
            className="absolute inset-0 size-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <TvMinimal className="size-10 text-muted-foreground" />
            <p className="font-semibold">Transmissão indisponível</p>
            <p className="text-sm text-muted-foreground">Este conteúdo não possui um endereço de player no momento.</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t bg-card p-2">
        <span className="mr-auto flex items-center gap-2 truncate px-2 text-sm font-bold">
          {mode === "live" ? <span className="live-dot size-2 rounded-full bg-live" /> : <PlayCircle className="size-4 shrink-0 text-primary" />} {title}
        </span>
        {onPrev && <button className={btn} onClick={onPrev} aria-label="Canal anterior"><ChevronLeft className="size-4" /><span className="hidden sm:inline">Anterior</span></button>}
        {onNext && <button className={btn} onClick={onNext} aria-label="Próximo canal"><span className="hidden sm:inline">Próximo</span><ChevronRight className="size-4" /></button>}
        <button className={btn} onClick={() => setNonce((n) => n + 1)} disabled={!src} aria-label="Recarregar player"><RotateCw className="size-4" /><span className="hidden sm:inline">Recarregar</span></button>
        <button className={btn} onClick={() => setShowCastHelp((v) => !v)} aria-expanded={showCastHelp} aria-controls="mc-cast-help" aria-label="Como transmitir para a TV">
          <Cast className="size-4" /><span className="hidden sm:inline">Transmitir</span>
        </button>
        <button className={btn} onClick={toggleFull} aria-label={big ? "Sair do modo ampliado" : "Ampliar player"}>
          {big ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          <span className="hidden sm:inline">{big ? "Sair" : "Ampliar"}</span>
        </button>
      </div>
      {showCastHelp && (
        <section id="mc-cast-help" role="status" aria-live="polite" className="border-t border-input bg-card p-4">
          <div className="flex items-start gap-3">
            <Cast className="mt-1 size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <h3 className="font-bold">Transmitir {title} para a TV</h3>
              <p className="text-muted-foreground">
                Este canal é carregado por um player externo incorporado. A transmissão direta pelo botão Cast depende de o provedor oferecer suporte a Google Cast.
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Conecte o celular ou computador e o Chromecast à mesma rede Wi-Fi.</li>
                <li>No Chrome, abra o menu ⋮ e escolha Transmitir; selecione a tela ou a aba com o canal.</li>
                <li>Em celulares compatíveis, use a opção Transmitir/Espelhar nas configurações do dispositivo.</li>
              </ol>
              <p className="text-xs text-muted-foreground">Para transmissão nativa com controles próprios, o provedor precisa disponibilizar uma URL de mídia compatível ou um receptor Cast.</p>
            </div>
            <button className={btn} onClick={() => setShowCastHelp(false)} aria-label="Fechar instruções de transmissão"><X className="size-4" /></button>
          </div>
        </section>
      )}
    </div>
  );
}
