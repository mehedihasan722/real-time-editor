"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AssistConnections({ onRefresh }: { onRefresh: (result: { chat: boolean; generate: boolean; image?: boolean; providers?: Record<string, boolean> }) => void }) {
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState<Record<string, string>>({}); const [error, setError] = useState("");
  const refresh = async () => {
    setBusy(true); setError("");
    try { const response = await fetch("/api/assist", { cache: "no-store", signal: AbortSignal.timeout(10000) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Cannot check connections."); setStatus(result.status || {}); onRefresh(result); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Cannot check connections."); }
    finally { setBusy(false); }
  };
  return <details className="my-2 rounded-lg border bg-muted/20 p-3 text-xs"><summary className="cursor-pointer font-medium">AI connections & setup</summary><div className="mt-2 space-y-2"><p>Configure server credentials, then restart the local app or redeploy Vercel. Nano Banana uses the Gemini key.</p><ul className="space-y-1"><li>Gemini / Nano Banana: <code>GEMINI_API_KEY</code> · <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">Get key</a></li><li>Grok: <code>XAI_API_KEY</code> · <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="underline">xAI console</a></li><li>DeepSeek: <code>DEEPSEEK_API_KEY</code> · <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="underline">Get key</a></li><li>Local Hermes: run <code>npm run ai:setup</code> with Docker Desktop running.</li></ul><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>{busy ? "Checking…" : "Refresh connections"}</Button><ul aria-label="AI connection status">{Object.entries(status).map(([name, value]) => <li key={name} className="capitalize">{name}: <span className="normal-case">{value}</span></li>)}</ul>{error && <p role="alert">{error}</p>}</div></details>;
}
