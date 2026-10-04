"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_KEY, captureWorkspaceEvent } from "@/lib/analytics";

export function WorkspaceAnalytics() {
  const pathname = usePathname();
  useEffect(() => { captureWorkspaceEvent("workspace_viewed", pathname.startsWith("/board/") ? "board" : pathname.split("/")[1] || "dashboard"); }, [pathname]);
  return null;
}

export function AnalyticsPreference() {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { try { setEnabled(localStorage.getItem(ANALYTICS_CONSENT_KEY) === "yes"); } catch { /* Off by default. */ } }, []);
  return <div className="space-y-2"><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={enabled} disabled={!process.env.NEXT_PUBLIC_POSTHOG_KEY} onChange={event => { try { localStorage.setItem(ANALYTICS_CONSENT_KEY, event.target.checked ? "yes" : "no"); setEnabled(event.target.checked); setError(""); if (event.target.checked) captureWorkspaceEvent("workspace_viewed", "settings"); } catch { setError("This browser cannot save analytics preferences."); } }} />Share anonymous product usage</label><p className="text-xs text-muted-foreground">Optional PostHog analytics. No board content, account IDs, URLs, or email addresses are sent. Do Not Track is respected.</p>{error && <p role="alert">{error}</p>}</div>;
}
