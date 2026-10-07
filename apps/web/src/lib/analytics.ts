export const ANALYTICS_CONSENT_KEY = "flowboard-analytics-consent";
export function captureWorkspaceEvent(event: "workspace_viewed" | "board_service_completed", action?: string) {
  try {
    if (localStorage.getItem(ANALYTICS_CONSENT_KEY) !== "yes" || navigator.doNotTrack === "1") return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com");
    if (!key || host.protocol !== "https:" || !["us.i.posthog.com", "eu.i.posthog.com"].includes(host.hostname)) return;
    let distinctId = sessionStorage.getItem("flowboard-analytics-session");
    if (!distinctId) { distinctId = crypto.randomUUID(); sessionStorage.setItem("flowboard-analytics-session", distinctId); }
    const safeAction = ["dashboard", "board", "admin", "games", "guide", "templates", "settings", "backup", "restore", "delete-backup", "email", "index"].includes(action || "") ? action : "other";
    void fetch(`${host.origin}/capture/`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", referrerPolicy: "no-referrer", body: JSON.stringify({ api_key: key, event, properties: { distinct_id: distinctId, action: safeAction, $process_person_profile: false, $geoip_disable: true } }) }).catch(() => {});
  } catch { /* Analytics must never interrupt the workspace when storage is blocked. */ }
}
