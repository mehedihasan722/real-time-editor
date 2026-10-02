"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Folder, Inbox, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useSelf, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layer, LayerType, NoteLayer } from "@/types/canvas";
import { MAX_LAYERS } from "@/lib/board-portability";
import { toast } from "sonner";

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const plainText = (value = "") => value.replace(/<[^>]*>/g, "").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&amp;", "&");
const noteText = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function TaskWorkspace({ onCanvas }: { onCanvas: () => void }) {
  const tasks = useStorage(root => root.layerIds.flatMap(id => {
    const layer = root.layers[id];
    return layer?.type === LayerType.Note ? [{ id, ...layer }] : [];
  }));
  const canWrite = useSelf(me => me.canWrite);
  const author = useSelf(me => me.info?.name || "Team member");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [view, setView] = useState("Inbox");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [project, setProject] = useState("");
  const [adding, setAdding] = useState(false);
  const today = dateKey(new Date());
  const projects = [...new Set(tasks.map(task => task.project).filter((value): value is string => !!value))].sort();
  const visible = tasks.filter(task => {
    if (view === "Completed" ? !task.completed : task.completed) return false;
    if (view === "Today" && task.dueDate !== today) return false;
    if (view === "Upcoming" && (!task.dueDate || task.dueDate <= today)) return false;
    if (view.startsWith("date:") && task.dueDate !== view.slice(5)) return false;
    if (view.startsWith("project:") && task.project !== view.slice(8)) return false;
    return `${plainText(task.value)} ${task.project || ""}`.toLowerCase().includes(search.toLowerCase());
  });
  const add = useMutation(({ storage, self }) => {
    if (!self.canWrite) return;
    if (!title.trim()) return;
    if (storage.get("layers").size >= MAX_LAYERS) { toast.error("Board object limit reached."); return; }
    const id = nanoid();
    const note: NoteLayer = { type: LayerType.Note, x: 190 + tasks.length % 4 * 250, y: 240 + Math.floor(tasks.length / 4) * 210, width: 210, height: 180, fill: { r: 199, g: 239, b: 210, a: 1 }, value: noteText(title.trim()), author, completed: false, ...(due ? { dueDate: due } : {}), ...(project.trim() ? { project: project.trim() } : {}) };
    storage.get("layers").set(id, new LiveObject<Layer>(note));
    storage.get("layerIds").push(id);
    // Always reveal the saved task, even when a date, project, or search filter was active.
    setView("Inbox"); setSearch(""); setTitle(""); setAdding(false);
  }, [title, due, project, author, tasks.length]);
  const update = useMutation(({ storage, self }, id: string, patch: Partial<NoteLayer>) => {
    if (!self.canWrite) return;
    const layer = storage.get("layers").get(id);
    if (layer?.get("type") === LayerType.Note) layer.update(patch);
  }, []);
  const remove = useMutation(({ storage, self }, id: string) => {
    if (!self.canWrite) return;
    storage.get("layers").delete(id);
    const ids = storage.get("layerIds"); const index = ids.indexOf(id);
    if (index !== -1) ids.delete(index);
  }, []);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const heading = view.startsWith("project:") ? view.slice(8) : view.startsWith("date:") ? view.slice(5) : view;
  return <main className="flex h-dvh bg-muted/40 p-3 md:p-8">
    <div className="mx-auto flex w-full max-w-7xl overflow-hidden rounded-2xl border bg-background text-foreground shadow-xl">
      <aside className="hidden sm:flex w-14 shrink-0 flex-col items-center gap-5 border-r py-5">
        <Link href="/" aria-label="Back to boards" className="rounded-lg bg-muted p-2"><Folder size={18} /></Link>
        <span className="mt-20 rounded-lg bg-primary/10 p-2 text-primary"><CheckCircle2 size={18} /></span>
        <CalendarDays size={18} className="text-muted-foreground" />
        <Button variant="ghost" size="icon" className="mt-auto" onClick={onCanvas} aria-label="Open board canvas"><ChevronRight size={18} /></Button>
      </aside>
      <aside className="hidden w-60 shrink-0 flex-col gap-5 border-r bg-muted/20 p-4 md:flex">
        <div className="flex items-center justify-between text-sm font-medium"><span>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span><div className="flex"><Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={14} /></Button><Button size="icon" variant="ghost" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={14} /></Button></div></div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">{["M", "T", "W", "T", "F", "S", "S"].map((label, i) => <span key={i} className="py-1 text-muted-foreground">{label}</span>)}{Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)); return <button key={date} onClick={() => setView(`date:${date}`)} aria-label={`Tasks for ${date}`} className={`relative rounded-full py-1.5 ${view === `date:${date}` || date === today ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{i + 1}{tasks.some(task => task.dueDate === date && !task.completed) && <span className="absolute bottom-0 left-1/2 h-1 w-1 rounded-full bg-current" />}</button>; })}</div>
        <Button variant="ghost" className="justify-start gap-2" disabled={!canWrite} onClick={() => setAdding(true)}><Plus size={16} /> Add task</Button>
        <nav className="space-y-1">{["Inbox", "Today", "Upcoming", "Completed"].map(label => <Button key={label} variant={view === label ? "secondary" : "ghost"} className="w-full justify-start gap-2" onClick={() => setView(label)}>{label === "Inbox" ? <Inbox size={16} /> : label === "Completed" ? <CheckCircle2 size={16} /> : <CalendarDays size={16} />}{label}<span className="ml-auto text-xs">{tasks.filter(task => label === "Completed" ? task.completed : !task.completed && (label === "Inbox" || label === "Today" && task.dueDate === today || label === "Upcoming" && !!task.dueDate && task.dueDate > today)).length}</span></Button>)}</nav>
        <div className="space-y-1"><p className="mb-2 flex gap-2 text-sm text-muted-foreground"><Folder size={16} /> Projects</p>{projects.map(name => <Button key={name} variant={view === `project:${name}` ? "secondary" : "ghost"} className="w-full justify-start gap-2" onClick={() => setView(`project:${name}`)}><Folder size={14} /><span className="truncate">{name}</span></Button>)}{!projects.length && <p className="text-xs text-muted-foreground">Assign a project when adding a task.</p>}</div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
        <div className="relative mx-auto mb-5 w-full max-w-md"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input className="pl-9" aria-label="Search tasks" placeholder="Search tasks" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <header className="mb-4 flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{heading}</h1><span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">{visible.length} tasks</span><Button size="sm" variant="secondary" className="ml-auto gap-2" disabled={!canWrite} onClick={() => setAdding(true)}><Plus size={14} /> Add task</Button><Button size="sm" variant="outline" onClick={onCanvas}>Canvas</Button></header>
        <select aria-label="Task view" className="mb-3 rounded border bg-background p-2 md:hidden" value={view} onChange={event => setView(event.target.value)}>{["Inbox", "Today", "Upcoming", "Completed"].map(label => <option key={label}>{label}</option>)}</select>
        <div className="flex-1 overflow-y-auto rounded-xl border p-3 shadow-sm md:p-5">
          {!canWrite && <p role="status" className="mb-3 text-sm text-muted-foreground">Read-only board. Ask an administrator for editing access.</p>}
          {adding && canWrite && <form onSubmit={event => { event.preventDefault(); add(); }} className="mb-5 space-y-3 rounded-lg border bg-muted/20 p-4"><Input autoFocus aria-label="Task title" placeholder="What needs to be done?" maxLength={1000} value={title} onChange={event => setTitle(event.target.value)} required /><div className="flex flex-wrap gap-2"><Input aria-label="Due date" type="date" className="w-full sm:w-44" value={due} onChange={event => setDue(event.target.value)} /><Input aria-label="Project name" placeholder="Project (optional)" maxLength={100} className="w-full sm:w-48" value={project} onChange={event => setProject(event.target.value)} /><Button type="submit">Add task</Button><Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div></form>}
          {!visible.length && <div className="py-16 text-center text-muted-foreground"><CheckCircle2 className="mx-auto mb-3" /><p>No tasks here yet.</p><Button variant="link" disabled={!canWrite} onClick={() => setAdding(true)}>Create a task</Button></div>}
          {visible.map(task => <article key={task.id} className="group mb-3 rounded-lg border border-transparent p-3 hover:border-border hover:bg-muted/20"><div className="mb-1 flex gap-3 text-xs text-muted-foreground">{task.dueDate && <span>{task.dueDate === today ? "Today" : task.dueDate}</span>}{task.project && <span className="flex gap-1"><Folder size={12} />{task.project}</span>}</div><div className="flex items-start gap-3"><input aria-label={`Complete ${plainText(task.value)}`} type="checkbox" disabled={!canWrite} checked={!!task.completed} onChange={event => update(task.id, { completed: event.target.checked })} className="mt-2 h-4 w-4 accent-primary" /><input readOnly={!canWrite} aria-label="Edit task title" defaultValue={plainText(task.value)} key={`${task.id}-${task.value}`} maxLength={1000} onBlur={event => { if (event.target.value.trim() && event.target.value !== plainText(task.value)) update(task.id, { value: noteText(event.target.value.trim()) }); }} className={`min-w-0 flex-1 bg-transparent py-1 text-sm outline-none focus:ring-1 focus:ring-ring ${task.completed ? "line-through text-muted-foreground" : ""}`} /><Button variant="ghost" size="icon" disabled={!canWrite} aria-label={`Delete ${plainText(task.value)}`} onClick={() => remove(task.id)}><Trash2 size={14} /></Button></div></article>)}
        </div>
      </section>
    </div>
  </main>;
}
