import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { createHash } from "node:crypto";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { publicEnv } from "@/lib/public-env";
import { canEdit, workspaceRole } from "@/lib/roles";
import { boundedJson } from "@/lib/bounded-json";
import { boardFileSchema } from "@/lib/board-portability";
import { boardBackup, emailBoardLink, integrationStatus, pineconeBoard, reserveServiceRequest, verifyTurnstile } from "@/lib/workspace-services";
import { reportFailure } from "@/lib/monitoring";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), query: z.string().trim().min(2).max(200), turnstileToken: z.string().max(2048).optional() }),
  z.object({ action: z.enum(["backup", "restore", "delete-backup", "email", "index"]), boardId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/), snapshot: boardFileSchema.optional(), turnstileToken: z.string().max(2048).optional() }),
]);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export const maxDuration = 60;

export async function GET() {
  const authorization = await auth();
  if (!authorization.userId || !authorization.orgId) return json({ error: "Sign in and select a team." }, 401);
  return json({ services: integrationStatus(), turnstileRequired: Boolean(process.env.TURNSTILE_SECRET_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Cross-site request denied." }, 403);
  const authorization = await auth();
  if (!authorization.userId || !authorization.orgId) return json({ error: "Sign in and select a team." }, 401);
  if (!publicEnv.success) return json({ error: "Workspace services are not configured." }, 503);
  let parsed;
  try { parsed = schema.safeParse(await boundedJson(new Response(request.body, { headers: request.headers }), 3_000_000)); }
  catch { return json({ error: "Invalid request or board snapshot exceeds 3 MB." }, 400); }
  if (!parsed.success) return json({ error: "Invalid workspace request." }, 400);
  const input = parsed.data;
  if (input.action !== "search" && !canEdit(workspaceRole(authorization.orgRole))) return json({ error: "A member role is required." }, 403);
  const services = integrationStatus();
  const service = input.action === "search" || input.action === "index" ? "pinecone" : input.action === "email" ? "resend" : "supabase";
  if (!services[service] || !services.upstash) return json({ error: "This feature and its rate limiter must be configured by your administrator." }, 503);
  if (input.action === "backup" && !input.snapshot) return json({ error: "Provide an editable board snapshot." }, 400);
  try {
    const aud = authorization.sessionClaims?.aud;
    const token = await authorization.getToken(aud === "convex" || Array.isArray(aud) && aud.includes("convex") ? undefined : { template: "convex" });
    if (!token) return json({ error: "Workspace authentication unavailable." }, 403);
    const convex = new ConvexHttpClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL);
    convex.setAuth(token);
    const accessible = async (id: string) => {
      const board = await convex.query(api.board.get, { id: id as Id<"boards"> }).catch(() => null);
      return board?.orgId === authorization.orgId ? board : null;
    };
    const board = input.action === "search" ? null : await accessible(input.boardId);
    if (input.action !== "search" && !board) return json({ error: "Board access denied." }, 403);
    if (!await reserveServiceRequest(authorization.orgId, authorization.userId)) return json({ error: "Too many requests. Wait a minute." }, 429);
    if (!await verifyTurnstile(input.turnstileToken)) return json({ error: "Complete verification and try again." }, 403);
    if (input.action === "search") {
      const ids = await pineconeBoard("search", authorization.orgId, { query: input.query });
      const boards = await Promise.all(ids.map(accessible));
      return json({ boards: boards.flatMap(item => item ? [{ id: item._id, title: item.title }] : []) });
    }
    if (input.action === "index") await pineconeBoard("index", authorization.orgId, { boardId: input.boardId, title: board!.title });
    else if (input.action === "email") {
      const user = await currentUser();
      const email = user?.primaryEmailAddress;
      if (!email || email.verification?.status !== "verified") return json({ error: "Verify your primary email in account settings first." }, 400);
      const key = createHash("sha256").update(`${authorization.orgId}:${authorization.userId}:${input.boardId}:${board!.title}:${email.emailAddress}:${Math.floor(Date.now() / 600000)}`).digest("hex");
      await emailBoardLink(email.emailAddress, board!.title, input.boardId, key);
    } else {
      const snapshot = await boardBackup(input.action, authorization.orgId, input.boardId, input.snapshot);
      if (input.action === "restore") return json({ snapshot: boardFileSchema.parse(snapshot) });
    }
    return json({ success: true });
  } catch (error) {
    reportFailure("route", error);
    return json({ error: "The service could not finish this request. Check configuration or try again." }, 502);
  }
}
