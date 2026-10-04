"use client";
import { useEffect, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnalyticsPreference } from "./workspace-analytics";
import { TurnstileVerification } from "./turnstile-verification";

const labels = { supabase: "Supabase · private board backups", resend: "Resend · email board links", clerk: "Clerk · sign-in and team access", cloudflare: "Cloudflare · request verification", posthog: "PostHog · optional product analytics", sentry: "Sentry · error monitoring", upstash: "Upstash · request rate limits", pinecone: "Pinecone · semantic board search" };
export function WorkspaceIntegrations() {
  const { organization } = useOrganization();
  const [status, setStatus] = useState<{ services: Record<string, boolean>; turnstileRequired: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [token, setToken] = useState("");
  const [verification, setVerification] = useState(0);
  const [results, setResults] = useState<{ id: string; title: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setStatus(null); setResults(null); setError("");
    fetch("/api/integrations", { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(); const data = await response.json(); if (!controller.signal.aborted) setStatus(data); }).catch(() => { if (!controller.signal.aborted) setError("Could not check workspace services."); });
    return () => controller.abort();
  }, [organization?.id]);
  return <div className="my-6 space-y-5"><h3 className="font-semibold">Workspace services</h3><div className="grid gap-2 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => <div key={key} className="rounded-lg border p-3"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{status ? status.services[key] ? "Configured" : "Not configured" : "Checking…"}</p></div>)}</div><AnalyticsPreference /><form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError(""); setResults(null);
    try { const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", query, turnstileToken: token }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setResults(data.boards); }
    catch (err) { setError(err instanceof Error ? err.message : "Search unavailable."); }
    finally { setBusy(false); setToken(""); setVerification(value => value + 1); }
  }}><label htmlFor="semantic-search" className="block text-sm font-medium">Search indexed boards by meaning</label><p className="text-xs text-muted-foreground">Add a board from Board files → Cloud services first. Search sends your query to Pinecone and returns accessible boards in your team.</p><div className="flex gap-2"><Input id="semantic-search" value={query} maxLength={200} onChange={event => setQuery(event.target.value)} placeholder="For example, plans for the next launch" /><Button disabled={busy || query.trim().length < 2 || !status?.services.pinecone || !status?.services.upstash || status.turnstileRequired && !token}>{busy ? "Searching…" : "Search"}</Button></div>{status?.turnstileRequired && <TurnstileVerification key={verification} onToken={setToken} />}</form>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}{results && <div role="status">{results.length ? results.map(board => <Link className="block rounded-md border p-3 text-sm hover:bg-muted" key={board.id} href={`/board/${board.id}`}>{board.title}</Link>) : <p className="text-sm text-muted-foreground">No indexed boards matched.</p>}</div>}</div>;
}
