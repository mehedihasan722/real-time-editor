"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowUp,
  Bot,
  LayoutGrid,
  Map,
  Network,
  Sparkles,
  X,
} from "lucide-react";
import { assistPromptSchema, resolveAssistTemplate } from "@/lib/board-templates";
import { generatedBoardLayers, generatedBoardSchema } from "@/lib/assist";
import { Layer } from "@/types/canvas";

const suggestions = [
  { label: "Brainstorm ideas", template: "AI Playground" },
  { label: "Map user journey", template: "Flowchart" },
  { label: "Plan roadmap", template: "Roadmap" },
  { label: "Create research plan", template: "Product requirements" },
];

interface BoardStarterProps {
  boardId: string;
  onGenerated: (layers: Layer[]) => void;
  name?: string;
  onClose: () => void;
  onStart: (template: string, prompt?: string) => void;
}

export const BoardStarter = ({ boardId, onGenerated, name, onClose, onStart }: BoardStarterProps) => {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"generate" | "chat" | "templates">("templates");
  const [provider, setProvider] = useState("auto");
  const [available, setAvailable] = useState({ generate: false, chat: false });
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [generated, setGenerated] = useState<ReturnType<typeof generatedBoardSchema.parse> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/assist", { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(configuration => {
      if (!configuration || controller.signal.aborted) return;
      const capabilities = { generate: configuration.generate === true, chat: configuration.chat === true };
      setAvailable(capabilities);
      if (capabilities.generate) setMode("generate");
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = assistPromptSchema.safeParse(prompt);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Enter a board prompt.");
      return;
    }
    setError("");
    if (mode === "templates") { onStart(resolveAssistTemplate(parsed.data), parsed.data); return; }
    setBusy(true); setGenerated(null);
    const conversation = [...(mode === "chat" ? messages.slice(-18) : []), { role: "user" as const, content: parsed.data }];
    try {
      const response = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardId, mode, provider, messages: conversation }), signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Assist could not complete the request.");
      if (mode === "generate") setGenerated(generatedBoardSchema.parse(result.board));
      else { setMessages([...conversation, { role: "assistant", content: result.message }]); setPrompt(""); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Assist is unavailable. Try a starter template."); }
    finally { setBusy(false); }
  };

  return (
    <section className="board-starter" aria-labelledby="board-starter-title">
      <button className="board-starter__close" onClick={onClose} aria-label="Close starter">
        <X className="size-4" />
      </button>
      <div className="board-starter__title-row">
        <span><Sparkles className="size-5" /></span>
        <div>
          <p>FLOWBOARD ASSIST</p>
          <h1 id="board-starter-title">Hey {name?.split(" ")[0] || "there"}, what are we working on?</h1>
        </div>
      </div>
      <label className="block text-sm">AI provider <select aria-label="AI provider" className="rounded-md border bg-background p-2" value={provider} disabled={busy} onChange={event => setProvider(event.target.value)}><option value="auto">Automatic</option><option value="hermes">Hermes</option><option value="gemini">Gemini</option><option value="grok">Grok</option><option value="deepseek">DeepSeek</option><option value="custom">Custom model</option></select></label><div className="board-starter__suggestions" aria-label="Assistant mode">
        {(["generate", "chat", "templates"] as const).map(value => <button key={value} aria-pressed={mode === value} disabled={busy || (value !== "templates" && !available[value])} title={value !== "templates" && !available[value] ? "This AI service is not configured yet" : undefined} onClick={() => { setMode(value); setError(""); setGenerated(null); }}>{value === "generate" ? "AI board" : value === "chat" ? "Hermes chat" : "Starter templates"}</button>)}
      </div>
      {!available.generate && !available.chat && <p className="board-starter__availability" role="status">Starter templates are ready. AI services are not configured yet.</p>}
      {mode === "chat" && messages.length > 0 && <div className="max-h-48 overflow-auto text-sm" role="log" aria-label="Hermes conversation">{messages.map((message, index) => <p className="mb-3 whitespace-pre-wrap" key={index}><strong>{message.role === "user" ? "You" : "Hermes"}: </strong>{message.content}</p>)}</div>}
      <form className="board-starter__composer" onSubmit={submit}>
        <textarea
          value={prompt}
          onChange={(event) => { setPrompt(event.target.value); if (error) setError(""); }}
          maxLength={280}
          disabled={busy}
          placeholder="Try: Create a roadmap, a login flow, or 5 sticky notes for launch ideas..."
          aria-label="Describe your board"
        />
        <div>
          <span><Bot className="size-4" /> {busy ? "Working…" : mode === "chat" ? "Hermes Agent" : mode === "generate" ? "AI board generator" : "Guided workspace generator"}</span>
          <button type="submit" disabled={busy} aria-label={mode === "chat" ? "Send message to Hermes" : "Create workspace from prompt"}>
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
      {error && <p className="board-starter__error" role="alert">{error}</p>}
      {generated && <div className="max-h-56 overflow-auto text-sm"><h2 className="font-semibold">{generated.title}</h2><ul className="list-disc pl-5">{generated.notes.map((note, index) => <li key={index}>{note}</li>)}</ul><button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white" onClick={() => { onGenerated(generatedBoardLayers(generated)); setGenerated(null); }}>Add {generated.notes.length} notes to board</button></div>}
      <div className="board-starter__suggestions" aria-label="Starter suggestions">
        {suggestions.map((suggestion) => (
          <button key={suggestion.label} disabled={busy} onClick={() => onStart(suggestion.template, suggestion.label)}>
            {suggestion.label}
          </button>
        ))}
      </div>
      <div className="board-starter__modes">
        <button disabled={busy} onClick={() => onStart("Flowchart", prompt.trim() || undefined)}><Network className="size-4" /> Map a flow</button>
        <button disabled={busy} onClick={() => onStart("Kanban", prompt.trim() || undefined)}><LayoutGrid className="size-4" /> Organize ideas</button>
        <button disabled={busy} onClick={() => onStart("Roadmap", prompt.trim() || undefined)}><Map className="size-4" /> Plan together</button>
      </div>
    </section>
  );
};
