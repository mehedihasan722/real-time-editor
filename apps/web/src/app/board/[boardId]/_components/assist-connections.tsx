"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AssistConnections({ onRefresh }: { onRefresh: (result: { chat: boolean; generate: boolean; image?: boolean; providers?: Record<string, boolean> }) => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const refresh = async () => {
    setBusy(true); setError("");
    try { const response = await fetch("/api/assist", { cache: "no-store", signal: AbortSignal.timeout(10000) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Cannot check connections."); onRefresh(result); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Cannot check connections."); }
    finally { setBusy(false); }
  };
  return <div className="my-2"><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void refresh()}>{busy ? "Checking..." : "Check AI availability"}</Button>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div>;
}
