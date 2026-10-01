"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, Pause, Play, RotateCcw, Timer, Trash2 } from "lucide-react";
import { useMutation, useSelf, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Layer, LayerType, NoteLayer } from "@/types/canvas";
import { MAX_LAYERS } from "@/lib/board-portability";
import { toast } from "sonner";

const columns = [
  { lane: "positive", title: "Went Well", prompt: "What went well?", card: "bg-teal-700 text-white dark:bg-teal-950 dark:text-teal-50", fill: { r: 199, g: 239, b: 210, a: 1 } },
  { lane: "improve", title: "To Improve", prompt: "What could we improve?", card: "bg-violet-700 text-white dark:bg-violet-950 dark:text-violet-50", fill: { r: 181, g: 216, b: 255, a: 1 } },
  { lane: "action", title: "Take Action", prompt: "What should we do next?", card: "bg-blue-700 text-white dark:bg-blue-950 dark:text-blue-50", fill: { r: 255, g: 229, b: 114, a: 1 } },
] as const;
const plain = (value = "") => value.replace(/<[^>]*>/g, "").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
const encode = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function RetrospectiveWorkspace({ onCanvas }: { onCanvas: () => void }) {
  const notes = useStorage(root => root.layerIds.flatMap(id => {
    const layer = root.layers[id];
    return layer?.type === LayerType.Note ? [{ id, ...layer }] : [];
  }));
  const name = useSelf(me => me.info?.name || "Team member");
  const [drafts, setDrafts] = useState({ positive: "", improve: "", action: "" });
  const [anonymous, setAnonymous] = useState(false);
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [actionsOnly, setActionsOnly] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [running]);
  const add = useMutation(({ storage }, lane: NonNullable<NoteLayer["lane"]>) => {
    const value = drafts[lane].trim();
    if (!value) return;
    if (storage.get("layers").size >= MAX_LAYERS) { toast.error("Board object limit reached."); return; }
    const index = columns.findIndex(column => column.lane === lane);
    const id = nanoid();
    storage.get("layers").set(id, new LiveObject<Layer>({ type: LayerType.Note, x: 190 + index * 300, y: 240 + notes.filter(note => note.lane === lane).length * 210, width: 260, height: 180, fill: columns[index].fill, value: encode(value), author: anonymous ? "Anonymous" : name, lane }));
    storage.get("layerIds").push(id);
    setDrafts(current => ({ ...current, [lane]: "" }));
  }, [drafts, notes, anonymous, name]);
  const update = useMutation(({ storage }, id: string, patch: Partial<NoteLayer>) => {
    const layer = storage.get("layers").get(id);
    if (layer?.get("type") === LayerType.Note) layer.update(patch);
  }, []);
  const remove = useMutation(({ storage }, id: string) => {
    storage.get("layers").delete(id);
    const ids = storage.get("layerIds"); const index = ids.indexOf(id);
    if (index !== -1) ids.delete(index);
  }, []);
  return <main className="h-screen overflow-auto bg-slate-100 p-3 text-foreground dark:bg-slate-950 md:p-8">
    <div className="mx-auto flex min-h-full max-w-7xl overflow-hidden rounded-3xl border bg-background shadow-xl">
      <aside className="hidden w-20 shrink-0 flex-col items-center gap-8 border-r bg-background py-6 sm:flex">
        <Link href="/" aria-label="Back to boards" className="text-xl font-bold text-blue-600 dark:text-blue-300">F<span className="text-teal-600 dark:text-teal-300">b</span></Link>
        <Link href="/" aria-label="Home" className="mt-16 rounded-full bg-blue-600 p-3 text-white"><Home size={18} /></Link>
        <Button variant="ghost" size="icon" onClick={onCanvas} aria-label="Open canvas"><LayoutDashboard size={19} /></Button>
        <span className="mt-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold">{name.slice(0, 1).toUpperCase()}</span>
      </aside>
      <section className="min-w-0 flex-1 bg-gradient-to-b from-slate-50 via-blue-100 to-blue-200 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:p-7">
        <nav className="mb-7 flex flex-wrap items-center gap-2"><span className="rounded-full bg-background px-5 py-2 text-sm font-medium shadow-sm">Retrospective</span><Button variant="ghost" asChild><Link href="/templates">Templates</Link></Button><Button variant="ghost" onClick={onCanvas}>Board canvas</Button><span className="ml-auto rounded-full bg-teal-100 px-3 py-2 text-sm font-medium text-teal-900 dark:bg-teal-950 dark:text-teal-100">{name}</span></nav>
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Team Retrospective</h1><p className="mt-1 text-sm text-muted-foreground">Reflect together. Turn insights into next steps.</p></div><div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/90 p-2"><Timer size={16} /><span className="min-w-12 font-mono text-sm" role="timer" aria-label="Personal reflection timer">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span><Button size="sm" variant="outline" onClick={() => { if (seconds === 0) { setSeconds(300); setRunning(true); } else setRunning(value => !value); }}>{running && seconds > 0 ? <Pause size={14} /> : <Play size={14} />}<span className="ml-2">{running && seconds > 0 ? "Pause" : "Start"}</span></Button><Button size="icon" variant="ghost" aria-label="Reset timer" onClick={() => { setRunning(false); setSeconds(300); }}><RotateCcw size={14} /></Button><Button size="sm" onClick={() => setActionsOnly(value => !value)}>{actionsOnly ? "All columns" : "Review actions"}<ArrowRight size={14} className="ml-2" /></Button></div></header>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)} />Post anonymously</label><span className="text-muted-foreground">Notes sync with your team · Timer is personal</span></div>
        <div className={`grid gap-4 ${actionsOnly ? "mx-auto max-w-xl" : "lg:grid-cols-3"}`}>
          {columns.filter(column => !actionsOnly || column.lane === "action").map(column => {
            const items = notes.filter((note, index) => (note.lane || columns[index % 3].lane) === column.lane);
            return <section key={column.lane} aria-label={column.title} className="min-h-96 rounded-2xl border-2 border-white/90 bg-white/25 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
              <header className="mb-4 flex items-center justify-center gap-3 pt-2"><h2 className="text-xl font-medium">{column.title}</h2><span className="rounded border bg-background/70 px-2 text-xs">{items.length}</span></header>
              <form className="mb-4 rounded-xl border bg-background p-3 shadow-sm" onSubmit={event => { event.preventDefault(); add(column.lane); }}><textarea aria-label={`New note: ${column.title}`} placeholder={column.prompt} maxLength={2000} className="min-h-20 w-full resize-y bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" value={drafts[column.lane]} onChange={event => setDrafts(current => ({ ...current, [column.lane]: event.target.value }))} /><div className="flex justify-end"><Button type="submit" size="sm" variant="secondary" disabled={!drafts[column.lane].trim()}>Add note</Button></div></form>
              <div className="space-y-3">{items.map(note => <article key={note.id} className={`rounded-lg p-3 shadow-sm ${column.card}`}><textarea aria-label={`Edit ${column.title} note`} defaultValue={plain(note.value)} key={`${note.id}-${note.value}`} maxLength={2000} onBlur={event => { if (event.target.value.trim() && event.target.value !== plain(note.value)) update(note.id, { value: encode(event.target.value.trim()) }); }} className="min-h-16 w-full resize-y bg-transparent text-sm leading-5 outline-none focus:ring-2 focus:ring-white" /><footer className="mt-2 flex flex-wrap items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">{(note.author || "Team member").slice(0, 1).toUpperCase()}</span><span className="max-w-28 truncate text-xs">{note.author || "Team member"}</span><select aria-label="Move note to column" value={column.lane} onChange={event => update(note.id, { lane: event.target.value as NoteLayer["lane"] })} className="ml-auto max-w-28 rounded border border-white/30 bg-transparent p-1 text-xs">{columns.map(target => <option key={target.lane} value={target.lane} className="bg-background text-foreground">{target.title}</option>)}</select><button type="button" aria-label={`Delete note: ${plain(note.value)}`} onClick={() => remove(note.id)} className="rounded p-1 hover:bg-white/20"><Trash2 size={14} /></button></footer></article>)}</div>
            </section>;
          })}
        </div>
      </section>
    </div>
  </main>;
}
