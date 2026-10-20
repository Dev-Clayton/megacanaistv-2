import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleStop, LoaderCircle, WandSparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImg } from "./ui";
import { formatDay, formatTime } from "@/lib/time";
import type { Recommendation } from "@/lib/recommendations";

export function Recommendations() {
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<Recommendation[]>([]);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function recommend() {
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(""); setSummary(""); setItems([]); setStatus("Consultando a programação…");
    try {
      const response = await fetch("/api/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description }), signal: controller.signal });
      if (!response.ok) { const body = await response.json(); throw new Error(body.message ?? "Não foi possível consultar a IA."); }
      if (!response.body) throw new Error("A consulta não retornou uma resposta.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const chunk = await reader.read(); buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "status") setStatus(event.message);
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "result") { setSummary(event.summary); setItems(event.recommendations); }
        }
        if (chunk.done) break;
      }
    } catch (e) {
      if (controller.signal.aborted) setError("Busca interrompida.");
      else setError(e instanceof Error ? e.message : "Não foi possível concluir a busca.");
    } finally { setBusy(false); setStatus(""); abort.current = null; }
  }

  return <section id="para-voce" aria-labelledby="recommendations-title" className="scroll-mt-32 border-y bg-secondary/20 px-4 py-8 md:px-10">
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-3"><WandSparkles className="size-6 shrink-0 text-primary" /><h2 id="recommendations-title" className="text-2xl font-extrabold">O que você quer assistir?</h2><span className="text-xs font-bold text-primary">IA</span></div>
      <form onSubmit={(e) => { e.preventDefault(); if (!busy) void recommend(); }} className="space-y-3">
        <label htmlFor="watch-description" className="sr-only">Descreva o que quer assistir</label>
        <textarea id="watch-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} minLength={3} required rows={2} placeholder="Quero um filme de ação, notícias ou algo para assistir com a família…" className="w-full resize-y rounded-lg border border-input bg-card p-4 text-base outline-none focus:ring-2 focus:ring-ring" />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={busy || description.trim().length < 3}><ArrowRight /> Encontrar opções</Button>
          {busy && <Button type="button" variant="outline" onClick={() => abort.current?.abort()}><CircleStop /> Parar</Button>}
          {busy && <span role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 motion-safe:animate-spin" />{status}</span>}
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {summary && <p role="status" className="text-sm leading-relaxed text-muted-foreground">{summary}</p>}
    </div>
    {items.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.candidateId} className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3"><SafeImg src={item.image ?? undefined} alt="" className="size-12 shrink-0 object-contain" /><div className="min-w-0"><p className="text-xs font-bold text-primary">{item.channelName}</p><h3 className="break-words font-bold">{item.title}</h3></div></div>
      <p className="text-xs font-semibold text-muted-foreground">{item.status === "current" ? "No ar agora" : item.status === "upcoming" ? "A seguir" : "Programação não informada"}{item.start && ` · ${formatDay(item.start)} às ${formatTime(item.start)}`}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
      <Button asChild variant="secondary" className="mt-auto self-start"><Link to="/canal/$id" params={{ id: item.channelId }}><Play /> Abrir canal</Link></Button>
    </article>)}</div>}
  </section>;
}