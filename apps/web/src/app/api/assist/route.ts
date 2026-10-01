import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { assistRequestSchema, parseGeneratedBoard } from "@/lib/assist";
import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

export const maxDuration = 60;

export async function GET() {
  if (!publicEnv.success || !serverEnv.success) return Response.json({ generate: false, chat: false }, { headers: { "Cache-Control": "no-store" } });
  const authorization = await auth();
  if (!authorization.userId) return Response.json({ error: "Sign in to use Assist." }, { status: 401 });
  return Response.json({ generate: Boolean(process.env.AI_BASE_URL && process.env.AI_MODEL), chat: Boolean(process.env.HERMES_BASE_URL && process.env.HERMES_API_KEY) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!publicEnv.success || !serverEnv.success) return Response.json({ error: "Workspace services are not configured." }, { status: 503 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Cross-site request denied." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 100000) return Response.json({ error: "Request is too large." }, { status: 413 });
  const authorization = await auth();
  if (!authorization.userId || !authorization.orgId) return Response.json({ error: "Sign in and select a team to use Assist." }, { status: 401 });
  const body = await request.text();
  if (body.length > 100000) return Response.json({ error: "Request is too large." }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { payload = null; }
  const parsed = assistRequestSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Send a valid prompt with at most 20 messages." }, { status: 400 });
  const { mode, messages, boardId } = parsed.data;
  if (messages.at(-1)?.role !== "user") return Response.json({ error: "The last message must be a user prompt." }, { status: 400 });
  const audience = authorization.sessionClaims?.aud;
  const token = audience === "convex" || (Array.isArray(audience) && audience.includes("convex"))
    ? await authorization.getToken() : await authorization.getToken({ template: "convex" });
  if (!token) return Response.json({ error: "Workspace authentication is unavailable." }, { status: 403 });
  const convex = new ConvexHttpClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);
  const board = await convex.query(api.board.get, { id: boardId as Id<"boards"> }).catch(() => null);
  if (!board || board.orgId !== authorization.orgId) return Response.json({ error: "Board access denied." }, { status: 403 });

  const baseUrl = mode === "chat" ? process.env.HERMES_BASE_URL : process.env.AI_BASE_URL;
  const key = mode === "chat" ? process.env.HERMES_API_KEY : process.env.AI_API_KEY;
  const model = mode === "chat" ? "hermes-agent" : process.env.AI_MODEL;
  if (!baseUrl || !model || (mode === "chat" && !key)) return Response.json({ error: mode === "chat" ? "Hermes Agent is not connected yet. Ask your workspace administrator to configure it." : "AI generation is not connected yet. Use a starter template or ask your administrator to connect a model." }, { status: 503 });
  let url: URL;
  try {
    url = new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && url.protocol === "http:"))) throw new Error();
  } catch { return Response.json({ error: "The AI service URL is invalid. Production requires HTTPS." }, { status: 503 }); }

  try {
    // Only the user's submitted messages leave the app. No board contents, IDs, or Clerk tokens are sent.
    const response = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(50000),
      headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model, stream: false, max_tokens: 1024, ...(mode === "generate" && process.env.AI_REASONING_EFFORT ? { reasoning_effort: process.env.AI_REASONING_EFFORT } : {}), messages: [
        { role: "system", content: mode === "generate"
          ? 'Create useful board content. Return only JSON: {"title":"short title","notes":["note text"]}. Return 1 to 40 concise notes. No markup, tools, or external actions.'
          : "You are the Flowboard workspace assistant. Help with planning and brainstorming. You cannot change boards or execute external actions. Answer in plain text. Do not use tools." },
        ...messages,
      ] }),
    });
    if (!response.ok) return Response.json({ error: response.status === 429 ? "The AI provider is busy. Try again shortly." : "The AI service could not complete the request. Try again." }, { status: response.status === 429 ? 429 : 502 });
    const completion = await response.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim() || content.length > 50000) throw new Error("Invalid response");
    return Response.json(mode === "generate" ? { board: parseGeneratedBoard(content) } : { message: content }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "The AI service took too long. Try a shorter prompt." : "The AI response was unavailable or invalid. Try again." }, { status: 502 });
  }
}
