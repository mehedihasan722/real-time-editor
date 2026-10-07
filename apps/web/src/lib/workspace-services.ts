import { boundedJson } from "./bounded-json";

export function integrationStatus() {
  const env = process.env;
  return {
    supabase: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_BACKUP_BUCKET),
    resend: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.APP_URL),
    clerk: Boolean(env.CLERK_SECRET_KEY && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    cloudflare: Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.APP_URL),
    posthog: Boolean(env.NEXT_PUBLIC_POSTHOG_KEY),
    sentry: Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN),
    upstash: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    pinecone: Boolean(env.PINECONE_API_KEY && env.PINECONE_INDEX_HOST),
  };
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Service is not configured");
  return value;
}

function serviceUrl(name: string, suffix: string) {
  const value = required(name);
  const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
    !(url.hostname.endsWith(suffix) && url.hostname !== suffix.slice(1)) || url.pathname !== "/") throw new Error("Invalid service host");
  return url.origin;
}

async function upstream(url: string, options: RequestInit) {
  const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) { await response.body?.cancel(); throw new Error("Service request failed"); }
  return response;
}

export async function reserveServiceRequest(orgId: string, userId: string) {
  const response = await upstream(serviceUrl("UPSTASH_REDIS_REST_URL", ".upstash.io"), {
    method: "POST", headers: { Authorization: `Bearer ${required("UPSTASH_REDIS_REST_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n", "1", `flowboard:services:${orgId}:${userId}`]),
  });
  const data = await boundedJson(response, 4096);
  if (data.error || !Number.isSafeInteger(data.result) || data.result < 1) throw new Error("Invalid quota response");
  return data.result <= 12;
}

export async function verifyTurnstile(token: string | undefined) {
  if (!process.env.TURNSTILE_SECRET_KEY && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return true;
  if (!token || !integrationStatus().cloudflare) return false;
  const response = await upstream("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: required("TURNSTILE_SECRET_KEY"), response: token }),
  });
  const data = await boundedJson(response, 8192);
  return data.success === true && data.action === "workspace-services" && data.hostname === new URL(required("APP_URL")).hostname;
}

export async function boardBackup(action: "backup" | "restore" | "delete-backup", orgId: string, boardId: string, snapshot?: unknown) {
  const bucket = required("SUPABASE_BACKUP_BUCKET");
  const headers = { apikey: required("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${required("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" };
  const base = serviceUrl("SUPABASE_URL", ".supabase.co");
  const bucketResponse = await upstream(`${base}/storage/v1/bucket/${encodeURIComponent(bucket)}`, { headers });
  const metadata = await boundedJson(bucketResponse, 8192);
  if (metadata.public !== false) throw new Error("Backups require a private bucket");
  const object = [bucket, orgId, `${boardId}.json`].map(encodeURIComponent).join("/");
  const response = await upstream(`${base}/storage/v1/object/${action === "restore" ? "authenticated/" : ""}${action === "delete-backup" ? encodeURIComponent(bucket) : object}`, {
    method: action === "backup" ? "POST" : action === "restore" ? "GET" : "DELETE",
    headers: { ...headers, ...(action === "backup" ? { "x-upsert": "true" } : {}) },
    ...(action === "backup" ? { body: JSON.stringify(snapshot) } : action === "delete-backup" ? { body: JSON.stringify({ prefixes: [`${orgId}/${boardId}.json`] }) } : {}),
  });
  if (action === "restore") return boundedJson(response, 3_000_000);
  await response.body?.cancel();
}

export async function emailBoardLink(email: string, title: string, boardId: string, idempotencyKey: string) {
  const base = new URL(required("APP_URL"));
  if (base.protocol !== "https:" || base.username || base.password) throw new Error("Invalid application URL");
  const response = await upstream("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${required("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from: required("RESEND_FROM_EMAIL"), to: [email], subject: `Your Flowboard board: ${title}`, text: `Open ${title} in your workspace:\n${base.origin}/board/${encodeURIComponent(boardId)}\n\nSign in with your organization account to access this board.` }),
  });
  await response.body?.cancel();
}

export async function pineconeBoard(action: "index" | "search", orgId: string, value: { boardId?: string; title?: string; query?: string }) {
  const response = await upstream(`${serviceUrl("PINECONE_INDEX_HOST", ".pinecone.io")}/records/namespaces/${encodeURIComponent(orgId)}/${action === "index" ? "upsert" : "search"}`, {
    method: "POST", headers: { "Api-Key": required("PINECONE_API_KEY"), "X-Pinecone-Api-Version": "2025-10", "Content-Type": action === "index" ? "application/x-ndjson" : "application/json" },
    body: JSON.stringify(action === "index" ? { _id: value.boardId, chunk_text: value.title } : { query: { inputs: { text: value.query }, top_k: 10 }, fields: [] }),
  });
  if (action === "index") { await response.body?.cancel(); return []; }
  const data = await boundedJson(response, 64000);
  if (!Array.isArray(data.result?.hits)) throw new Error("Invalid search response");
  return data.result.hits.slice(0, 10).flatMap((hit: { _id?: unknown }) => typeof hit._id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(hit._id) ? [hit._id] : []) as string[];
}
