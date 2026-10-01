"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Bot, Home, LayoutGrid, MessageSquare, Plus, Send, Settings, Sparkles, Trash2 } from "lucide-react";
import { useSelf } from "@liveblocks/react/suspense";
import { Button } from "@/components/ui/button";
import { generatedBoardLayers, generatedBoardSchema } from "@/lib/assist";
import { Layer } from "@/types/canvas";
import { consumeAssistStream } from "@/lib/assist-stream";
import { m, useReducedMotion } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string; image?: string; board?: ReturnType<typeof generatedBoardSchema.parse> };
type Conversation = { id: string; title: string; mode: "chat" | "generate" | "image"; messages: Message[] };
function messagesPrompt(messages: Message[], index: number) { return messages.slice(0, index).reverse().find(message => message.role === "user")?.content || "AI generated image"; }
const firstConversation: Conversation = { id: "first", title: "New conversation", mode: "chat", messages: [] };

export function AIPlayground({ boardId, onCanvas, onGenerated }: { boardId: string; onCanvas: () => void; onGenerated: (layers: Layer[]) => void }) {
  const name = useSelf(me => me.info?.name || "You");
  const reducedMotion = useReducedMotion();
  const [conversations, setConversations] = useState<Conversation[]>([firstConversation]);
  const [activeId, setActiveId] = useState("first");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState({ chat: false, generate: false, image: false });
  const [provider, setProvider] = useState("auto");
  const [providers, setProviders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const request = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const active = conversations.find(conversation => conversation.id === activeId)!;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/assist", { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not check AI services.");
      if (!controller.signal.aborted) { setAvailable({ chat: result.chat === true, generate: result.generate === true, image: result.image === true }); setProviders(result.providers || {}); }
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not check AI services."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); request.current?.abort(); };
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "end" }); }, [active.messages.length, busy, reducedMotion]);
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
      const response = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ boardId, mode: active.mode, provider, stream: active.mode === "chat", messages: (active.mode === "chat" ? messages.slice(-19) : messages.slice(-1)).map(({ role, content }) => ({ role, content })) }) });
      if (response.ok && active.mode === "chat") {
        await consumeAssistStream(response, content => update(id, { messages: [...messages, { role: "assistant", content }] }), controller.signal);
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Assist could not complete this request.");
      const board = active.mode === "generate" ? generatedBoardSchema.parse(result.board) : undefined;
      if (active.mode === "image" && (typeof result.image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(result.image))) throw new Error("Invalid generated image.");
      if (!board && (typeof result.message !== "string" || !result.message.trim())) throw new Error("The assistant returned an empty response.");
      update(id, { messages: [...messages, { role: "assistant", content: board ? board.title : result.message, ...(board ? { board } : {}), ...(active.mode === "image" ? { image: result.image } : {}) }] });
    } catch (cause) {
      // Keep the prompt available for retry without duplicating it in history.
      update(id, { messages: active.messages }); setPrompt(submitted);
      setError(controller.signal.aborted ? "The request timed out or was cancelled. You can try again." : cause instanceof Error ? cause.message : "Assist is unavailable.");
    } finally { window.clearTimeout(timeout); request.current = null; setBusy(false); }
  };
  return <m.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .18 }} className="h-screen bg-muted/30 p-2 text-foreground md:p-7">
    <div className="mx-auto flex h-full max-w-7xl overflow-hidden rounded-2xl border bg-background shadow-sm">
      <aside className="hidden w-44 shrink-0 flex-col border-r p-4 lg:flex"><div className="mb-7 flex items-center gap-2 text-sm font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white">{name.slice(0, 1)}</span><span className="truncate">{name}</span></div><nav className="space-y-2">{[{ label: "Home", href: "/", icon: Home }, { label: "Templates", href: "/templates", icon: LayoutGrid }, { label: "Guide", href: "/guide", icon: BookOpen }].map(item => <Link key={item.label} href={item.href} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"><item.icon size={15} />{item.label}</Link>)}<span className="flex items-center gap-2 rounded-lg bg-violet-50 px-2 py-2 text-sm font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-100"><Sparkles size={15} />Playground</span></nav><Link href="/settings" className="mt-auto flex items-center gap-2 text-sm"><Settings size={15} />Settings</Link></aside>
      <aside className="flex w-36 shrink-0 flex-col border-r bg-muted/20 p-2 sm:w-56 sm:p-4"><Button variant="outline" size="sm" className="mb-5 gap-2" onClick={newChat} disabled={busy}><Plus size={14} />New chat</Button><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Conversations</p><div className="flex-1 space-y-2 overflow-auto">{conversations.map(conversation => <button key={conversation.id} disabled={busy} onClick={() => { setActiveId(conversation.id); setPrompt(""); setError(""); }} className={`w-full rounded-lg border p-3 text-left ${activeId === conversation.id ? "border-violet-400 bg-background shadow-sm dark:border-violet-500" : "border-transparent hover:bg-background"}`}><span className="mb-2 flex items-center gap-2 text-xs font-semibold"><Bot size={14} />{conversation.mode === "chat" ? "Flowboard Assist" : conversation.mode === "image" ? "Nano Banana" : "Board generator"}</span><span className="block break-words text-xs leading-5">{conversation.title}</span></button>)}</div><p className="mt-3 text-xs text-muted-foreground">History lasts while this Playground is open.</p></aside>
      <section className="flex min-w-0 flex-1 flex-col"><header className="flex flex-wrap items-center gap-2 border-b px-4 py-3"><h1 className="mr-auto flex items-center gap-2 font-semibold"><Sparkles size={17} />AI Playground</h1><Button variant="ghost" size="icon" aria-label="Clear conversation" disabled={busy || !active.messages.length} onClick={() => { update(active.id, { messages: [], title: "New conversation" }); setError(""); }}><Trash2 size={15} /></Button><Button variant="outline" size="sm" onClick={onCanvas} disabled={busy}>Canvas</Button></header>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-7" role="log" aria-label="AI conversation">
          {!active.messages.length && <div className="mx-auto max-w-lg py-12 text-center"><MessageSquare className="mx-auto mb-4 text-violet-600 dark:text-violet-300" size={32} /><h2 className="mb-2 text-xl font-semibold">What are we working on?</h2><p className="text-sm text-muted-foreground">Brainstorm with Hermes or generate editable notes for your board.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{["Help me plan a product launch", "Brainstorm onboarding ideas", "Create a team research plan"].map(suggestion => <Button key={suggestion} variant="outline" size="sm" onClick={() => setPrompt(suggestion)}>{suggestion}</Button>)}</div></div>}
          {active.messages.map((message, index) => <article key={index} className={`mx-auto mb-5 max-w-3xl rounded-2xl p-4 ${message.role === "assistant" ? "border bg-muted/10 shadow-sm" : ""}`}><div className="mb-3 flex items-center gap-2 text-xs font-semibold"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${message.role === "user" ? "bg-teal-700" : "bg-violet-700"}`}>{message.role === "user" ? name.slice(0, 1) : <Bot size={14} />}</span>{message.role === "user" ? "You" : active.mode === "chat" ? "Flowboard Assist" : active.mode === "image" ? "Nano Banana" : "Board generator"}</div><p className="whitespace-pre-wrap break-words border-l-2 border-violet-200 pl-4 text-sm leading-6 dark:border-violet-800">{message.content}</p>{message.image && <div className="mt-4"><Image unoptimized src={message.image} alt={messagesPrompt(active.messages, index)} width={1024} height={1024} className="h-auto max-h-96 w-auto rounded-xl" /><a href={message.image} download="flowboard-generated-image" className="mt-3 inline-block underline">Download image</a></div>}{message.board && <div className="mt-4 rounded-xl border p-4"><ul className="space-y-2 text-sm">{message.board.notes.map((note, i) => <li key={i} className="rounded-lg bg-muted p-2">{note}</li>)}</ul><Button className="mt-4" size="sm" onClick={() => onGenerated(generatedBoardLayers(message.board!))}>Add {message.board.notes.length} notes to canvas</Button></div>}</article>)}
          {busy && <div className="mx-auto flex max-w-3xl items-center justify-between"><p role="status" className="text-sm text-muted-foreground">Assistant is working…</p><Button variant="outline" size="sm" onClick={() => request.current?.abort()}>Stop response</Button></div>}<div ref={bottom} />
        </div>
        <div className="px-3 pb-3 sm:px-6 sm:pb-6">{error && <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{error}</p>}{!loading && !available[active.mode] && <p role="status" className="mb-2 text-sm text-muted-foreground">{active.mode === "chat" ? "Hermes chat" : "Board generation"} is not connected. Configure this service in the server environment to send messages.</p>}<form onSubmit={submit} className="rounded-2xl border p-3 shadow-sm"><textarea aria-label="Message to assistant" placeholder="Ask anything about your next idea…" maxLength={4000} disabled={busy} value={prompt} onChange={event => setPrompt(event.target.value)} className="min-h-20 w-full resize-y bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /><div className="flex flex-wrap justify-end gap-2"><select aria-label="AI provider" value={provider} disabled={busy || active.mode === "image"} onChange={event => setProvider(event.target.value)} className="rounded-md border bg-background px-2 py-1 text-sm">{[["auto", "Automatic"], ["hermes", "Hermes"], ["gemini", "Gemini"], ["grok", "Grok"], ["deepseek", "DeepSeek"], ["custom", "Custom model"]].map(([value, label]) => <option key={value} value={value}>{label}{value !== "auto" && !providers[value] ? " · not connected" : ""}</option>)}</select><select aria-label="Assistant mode" value={active.mode} disabled={busy} onChange={event => { const id = crypto.randomUUID(); setConversations(current => [{ id, title: "New conversation", mode: event.target.value as Conversation["mode"], messages: [] }, ...current]); setActiveId(id); setPrompt(""); setError(""); }} className="rounded-md border bg-background px-2 py-1 text-sm"><option value="chat">Chat</option><option value="generate">Board generator</option><option value="image">Nano Banana image</option></select><Button size="sm" type="submit" disabled={busy || loading || !available[active.mode] || !prompt.trim()} className="gap-2">{busy ? "Sending…" : "Send"}<Send size={14} /></Button></div></form></div>
      </section>
    </div>
  </m.main>;
}
