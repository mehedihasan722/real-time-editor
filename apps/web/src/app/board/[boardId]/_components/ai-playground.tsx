"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Bot, Home, LayoutGrid, MessageSquare, Plus, Send, Settings, Sparkles, Trash2 } from "lucide-react";
import { useSelf } from "@liveblocks/react/suspense";
import { Button } from "@/components/ui/button";
import { generatedBoardLayers, generatedBoardSchema } from "@/lib/assist";
import { Layer } from "@/types/canvas";

type Message = { role: "user" | "assistant"; content: string; board?: ReturnType<typeof generatedBoardSchema.parse> };
type Conversation = { id: string; title: string; mode: "chat" | "generate"; messages: Message[] };
const firstConversation: Conversation = { id: "first", title: "New conversation", mode: "chat", messages: [] };

export function AIPlayground({ boardId, onCanvas, onGenerated }: { boardId: string; onCanvas: () => void; onGenerated: (layers: Layer[]) => void }) {
  const name = useSelf(me => me.info?.name || "You");
  const [conversations, setConversations] = useState<Conversation[]>([firstConversation]);
  const [activeId, setActiveId] = useState("first");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState({ chat: false, generate: false });
  const [loading, setLoading] = useState(true);
  const request = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const active = conversations.find(conversation => conversation.id === activeId)!;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/assist", { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not check AI services.");
      if (!controller.signal.aborted) setAvailable({ chat: result.chat === true, generate: result.generate === true });
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not check AI services."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); request.current?.abort(); };
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [active.messages.length, busy]);
  const update = (id: string, patch: Partial<Conversation>) => setConversations(current => current.map(conversation => conversation.id === id ? { ...conversation, ...patch } : conversation));
  const newChat = () => {
    const id = crypto.randomUUID();
    setConversations(current => [{ id, title: "New conversation", mode: available.chat ? "chat" : "generate", messages: [] }, ...current]);
    setActiveId(id); setPrompt(""); setError("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !prompt.trim() || !available[active.mode]) return;
    const submitted = prompt.trim();
    const messages: Message[] = [...active.messages, { role: "user", content: submitted }];
    const id = active.id;
    update(id, { messages, title: active.messages.length ? active.title : submitted.slice(0, 60) });
    setPrompt(""); setBusy(true); setError("");
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ boardId, mode: active.mode, messages: (active.mode === "chat" ? messages.slice(-19) : messages.slice(-1)).map(({ role, content }) => ({ role, content })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Assist could not complete this request.");
      const board = active.mode === "generate" ? generatedBoardSchema.parse(result.board) : undefined;
      if (!board && (typeof result.message !== "string" || !result.message.trim())) throw new Error("The assistant returned an empty response.");
      update(id, { messages: [...messages, { role: "assistant", content: board ? board.title : result.message, ...(board ? { board } : {}) }] });
    } catch (cause) {
      // Keep the prompt available for retry without duplicating it in history.
      update(id, { messages: active.messages }); setPrompt(submitted);
      setError(controller.signal.aborted ? "The request timed out or was cancelled. You can try again." : cause instanceof Error ? cause.message : "Assist is unavailable.");
    } finally { window.clearTimeout(timeout); request.current = null; setBusy(false); }
  };
  return <main className="h-screen bg-muted/30 p-2 text-foreground md:p-7">
    <div className="mx-auto flex h-full max-w-7xl overflow-hidden rounded-2xl border bg-background shadow-sm">
      <aside className="hidden w-44 shrink-0 flex-col border-r p-4 lg:flex"><div className="mb-7 flex items-center gap-2 text-sm font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white">{name.slice(0, 1)}</span><span className="truncate">{name}</span></div><nav className="space-y-2">{[{ label: "Home", href: "/", icon: Home }, { label: "Templates", href: "/templates", icon: LayoutGrid }, { label: "Guide", href: "/guide", icon: BookOpen }].map(item => <Link key={item.label} href={item.href} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"><item.icon size={15} />{item.label}</Link>)}<span className="flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-2 text-sm font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-100"><Sparkles size={15} />Playground</span></nav><Link href="/settings" className="mt-auto flex items-center gap-2 text-sm"><Settings size={15} />Settings</Link></aside>
      <aside className="flex w-36 shrink-0 flex-col border-r bg-muted/20 p-2 sm:w-56 sm:p-4"><Button variant="outline" size="sm" className="mb-5 gap-2" onClick={newChat} disabled={busy}><Plus size={14} />New chat</Button><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Conversations</p><div className="flex-1 space-y-2 overflow-auto">{conversations.map(conversation => <button key={conversation.id} disabled={busy} onClick={() => { setActiveId(conversation.id); setPrompt(""); setError(""); }} className={`w-full rounded-lg border p-3 text-left ${activeId === conversation.id ? "border-violet-400 bg-background shadow-sm dark:border-violet-500" : "border-transparent hover:bg-background"}`}><span className="mb-2 flex items-center gap-2 text-xs font-semibold"><Bot size={14} />{conversation.mode === "chat" ? "Hermes Agent" : "Board generator"}</span><span className="block break-words text-xs leading-5">{conversation.title}</span></button>)}</div><p className="mt-3 text-xs text-muted-foreground">History lasts while this Playground is open.</p></aside>
      <section className="flex min-w-0 flex-1 flex-col"><header className="flex flex-wrap items-center gap-2 border-b px-4 py-3"><h1 className="mr-auto flex items-center gap-2 font-semibold"><Sparkles size={17} />AI Playground</h1><Button variant="ghost" size="icon" aria-label="Clear conversation" disabled={busy || !active.messages.length} onClick={() => { update(active.id, { messages: [], title: "New conversation" }); setError(""); }}><Trash2 size={15} /></Button><Button variant="outline" size="sm" onClick={onCanvas} disabled={busy}>Canvas</Button></header>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-7" role="log" aria-label="AI conversation">
          {!active.messages.length && <div className="mx-auto max-w-lg py-12 text-center"><MessageSquare className="mx-auto mb-4 text-violet-600 dark:text-violet-300" size={32} /><h2 className="mb-2 text-xl font-semibold">What are we working on?</h2><p className="text-sm text-muted-foreground">Brainstorm with Hermes or generate editable notes for your board.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{["Help me plan a product launch", "Brainstorm onboarding ideas", "Create a team research plan"].map(suggestion => <Button key={suggestion} variant="outline" size="sm" onClick={() => setPrompt(suggestion)}>{suggestion}</Button>)}</div></div>}
          {active.messages.map((message, index) => <article key={index} className={`mx-auto mb-5 max-w-3xl rounded-2xl p-4 ${message.role === "assistant" ? "border bg-muted/10 shadow-sm" : ""}`}><div className="mb-3 flex items-center gap-2 text-xs font-semibold"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${message.role === "user" ? "bg-teal-700" : "bg-violet-700"}`}>{message.role === "user" ? name.slice(0, 1) : <Bot size={14} />}</span>{message.role === "user" ? "You" : active.mode === "chat" ? "Hermes Agent" : "Board generator"}</div><p className="whitespace-pre-wrap break-words border-l-2 border-violet-200 pl-4 text-sm leading-6 dark:border-violet-800">{message.content}</p>{message.board && <div className="mt-4 rounded-xl border p-4"><ul className="space-y-2 text-sm">{message.board.notes.map((note, i) => <li key={i} className="rounded-lg bg-muted p-2">{note}</li>)}</ul><Button className="mt-4" size="sm" onClick={() => onGenerated(generatedBoardLayers(message.board!))}>Add {message.board.notes.length} notes to canvas</Button></div>}</article>)}
          {busy && <p role="status" className="mx-auto max-w-3xl text-sm text-muted-foreground">Assistant is working…</p>}<div ref={bottom} />
        </div>
        <div className="px-3 pb-3 sm:px-6 sm:pb-6">{error && <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{error}</p>}{!loading && !available[active.mode] && <p role="status" className="mb-2 text-sm text-muted-foreground">{active.mode === "chat" ? "Hermes chat" : "Board generation"} is not connected. Configure this service in the server environment to send messages.</p>}<form onSubmit={submit} className="rounded-2xl border p-3 shadow-sm"><textarea aria-label="Message to assistant" placeholder="Ask anything about your next idea…" maxLength={4000} disabled={busy} value={prompt} onChange={event => setPrompt(event.target.value)} className="min-h-20 w-full resize-y bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /><div className="flex flex-wrap justify-end gap-2"><select aria-label="Assistant mode" value={active.mode} disabled={busy} onChange={event => { const id = crypto.randomUUID(); setConversations(current => [{ id, title: "New conversation", mode: event.target.value as Conversation["mode"], messages: [] }, ...current]); setActiveId(id); setPrompt(""); setError(""); }} className="rounded-md border bg-background px-2 py-1 text-sm"><option value="chat">Hermes Agent</option><option value="generate">Board generator</option></select><Button size="sm" type="submit" disabled={busy || loading || !available[active.mode] || !prompt.trim()} className="gap-2">{busy ? "Sending…" : "Send"}<Send size={14} /></Button></div></form></div>
      </section>
    </div>
  </main>;
}
