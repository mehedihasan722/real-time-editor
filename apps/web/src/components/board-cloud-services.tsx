"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { TurnstileVerification } from "./turnstile-verification";
import { boardFileSchema } from "@/lib/board-portability";
import { captureWorkspaceEvent } from "@/lib/analytics";
import type { Layer } from "@/types/canvas";

function CloudActions({ boardId, snapshot }: { boardId: string; snapshot: () => Layer[] }) {
  const [status, setStatus] = useState<{ services: Record<string, boolean>; turnstileRequired: boolean } | null>(null);
  const [token, setToken] = useState(""); const [verification, setVerification] = useState(0);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { const controller = new AbortController(); fetch("/api/integrations", { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); const data = await response.json(); if (!controller.signal.aborted) setStatus(data); }).catch(() => { if (!controller.signal.aborted) setError("Cloud services could not be checked."); }); return () => controller.abort(); }, []);
  const run = async (action: string) => {
    if ((action === "backup" || action === "delete-backup") && !window.confirm(action === "backup" ? "Save this board to Supabase? This replaces its previous cloud snapshot." : "Permanently delete this board’s cloud snapshot?")) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, boardId, turnstileToken: token, ...(action === "backup" ? { snapshot: { version: 1, layers: snapshot() } } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (action === "restore") { const saved = boardFileSchema.parse(data.snapshot); const url = URL.createObjectURL(new Blob([JSON.stringify(saved)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `flowboard-${boardId}-cloud.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      setMessage(action === "backup" ? "Cloud snapshot saved." : action === "restore" ? "Snapshot downloaded. Use Import editable board to add it to a board." : action === "email" ? "Board link sent to your verified primary email." : action === "index" ? "Board title indexed. Search in Settings → Integrations." : "Cloud snapshot deleted.");
      captureWorkspaceEvent("board_service_completed", action);
    } catch (err) { setError(err instanceof Error ? err.message : "Cloud request failed."); }
    finally { setBusy(false); setToken(""); setVerification(value => value + 1); }
  };
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Cloud actions require configured services and rate limits. Snapshots contain editable board content and images, up to 3 MB; comments and history are excluded.</p>{[{ action: "backup", label: "Save latest cloud snapshot", service: "supabase" }, { action: "restore", label: "Download cloud snapshot", service: "supabase" }, { action: "delete-backup", label: "Delete cloud snapshot", service: "supabase" }, { action: "email", label: "Email board link to me", service: "resend" }, { action: "index", label: "Add title to semantic search", service: "pinecone" }].map(item => <Button className="w-full justify-start" variant="outline" key={item.action} disabled={busy || !status?.services[item.service] || !status?.services.upstash || status.turnstileRequired && !token} onClick={() => void run(item.action)}>{item.label}{status && !status.services[item.service] && " · Not configured"}</Button>)}<p className="text-xs text-muted-foreground">Semantic indexing sends only the current title to Pinecone. Cloud snapshots are retained until you delete them here, even if the board is later deleted. Email delivery is limited to your own verified address.</p>{status?.turnstileRequired && <TurnstileVerification key={verification} onToken={setToken} />}{busy && <p role="status">Working…</p>}{message && <p role="status" className="text-sm">{message}</p>}{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}</div>;
}
export function BoardCloudServices({ boardId, snapshot }: { boardId: string; snapshot: () => Layer[] }) {
  return <Dialog><DialogTrigger asChild><Button variant="outline" className="mt-2 w-full">Cloud services</Button></DialogTrigger><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Board cloud services</DialogTitle><DialogDescription>Save a private snapshot, email yourself a link, or index this board’s title.</DialogDescription></DialogHeader><CloudActions boardId={boardId} snapshot={snapshot} /></DialogContent></Dialog>;
}
