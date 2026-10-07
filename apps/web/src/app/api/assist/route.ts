import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { assistRequestSchema, parseGeneratedBoard } from "@/lib/assist";
import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

import { assistProviders, configuredProviders } from "@/lib/assist-providers";
import { attachedMessages } from "@/lib/assist-attachments";
import { boundedJson } from "@/lib/bounded-json";

export const maxDuration = 60;

export async function GET() {
  if (!publicEnv.success || !serverEnv.success) return Response.json({ generate: false, chat: false }, { headers: { "Cache-Control": "no-store" } });
  const authorization = await auth();
  if (!authorization.userId) return Response.json({ error: "Sign in to use Assist." }, { status: 401 });
  const providers = configuredProviders();
  const status: Record<string, string> = Object.fromEntries(Object.entries(providers).map(([name, configured]) => [name, configured ? "configured" : "missing configuration"]));
  const settings = assistProviders();
  await Promise.all((["hermes", "custom"] as const).map(async name => {
    if (!providers[name]) return;
    const service = settings[name];
    try {
      const url = new URL(service.base!);
      const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
      if (url.protocol === "http:" && process.env.NODE_ENV === "production") { providers[name] = false; status[name] = "production requires HTTPS"; return; }
      if (!local) return;
      const response = await fetch(`${service.base!.replace(/\/$/, "")}/models`, { headers: service.key ? { Authorization: `Bearer ${service.key}` } : {}, signal: AbortSignal.timeout(3000), redirect: "error" });
      if (!response.ok) throw new Error();
      status[name] = "online";
    } catch { providers[name] = false; status[name] = "unreachable; start Docker Desktop and the AI services"; }
  }));
  const external = providers.gemini || providers.grok || providers.deepseek;
  return Response.json({ generate: providers.custom || external, chat: providers.hermes || external, image: Boolean(process.env.GEMINI_API_KEY), providers, status }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!publicEnv.success || !serverEnv.success) return Response.json({ error: "Workspace services are not configured." }, { status: 503 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Cross-site request denied." }, { status: 403 });
  const limit = 3_500_000;
  if (Number(request.headers.get("content-length") ?? 0) > limit) return Response.json({ error: "Request is too large." }, { status: 413 });
  const authorization = await auth();
  if (!authorization.userId || !authorization.orgId) return Response.json({ error: "Sign in and select a team to use Assist." }, { status: 401 });
  const chunks: Uint8Array[] = []; let size = 0;
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Send a request body." }, { status: 400 });
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) { await reader.cancel(); return Response.json({ error: "Request is too large." }, { status: 413 }); } chunks.push(value); } }
  catch { return Response.json({ error: "Could not read request." }, { status: 400 }); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = new TextDecoder().decode(bytes);
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { payload = null; }
  const parsed = assistRequestSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Send a valid prompt with at most 20 messages." }, { status: 400 });
  const { mode, messages, boardId } = parsed.data;
  const streaming = mode === "chat" && parsed.data.stream === true;
  if (messages.at(-1)?.role !== "user") return Response.json({ error: "The last message must be a user prompt." }, { status: 400 });
  const audience = authorization.sessionClaims?.aud;
  const token = audience === "convex" || (Array.isArray(audience) && audience.includes("convex"))
    ? await authorization.getToken() : await authorization.getToken({ template: "convex" });
  if (!token) return Response.json({ error: "Workspace authentication is unavailable." }, { status: 403 });
  const convex = new ConvexHttpClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);
  const board = await convex.query(api.board.get, { id: boardId as Id<"boards"> }).catch(() => null);
  if (!board || board.orgId !== authorization.orgId) return Response.json({ error: "Board access denied." }, { status: 403 });

  const providers = assistProviders();
  const configured = configuredProviders();
  const preferred = mode === "chat" ? "hermes" : "custom";
  const provider = mode === "image" ? "gemini" : parsed.data.provider && parsed.data.provider !== "auto" ? parsed.data.provider : configured[preferred] ? preferred : (["gemini", "grok", "deepseek"] as const).find(name => configured[name]) as keyof typeof providers | undefined;
  const settings = provider ? providers[provider] : undefined;
  if (!provider || !configured[provider]) return Response.json({ error: "This AI provider is not connected. Configure its API key and model in the server environment." }, { status: 503 });
  const attachments = parsed.data.attachments || [];
  if (provider === "hermes" && attachments.some(file => file.kind === "image")) return Response.json({ error: "Hermes accepts text attachments. Choose a vision-capable Gemini, Grok, DeepSeek, or custom model for images." }, { status: 400 });
  const submittedMessages = attachedMessages(messages, attachments);
  const baseUrl = settings?.base;
  const key = settings?.key;
  const model = mode === "image" ? process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image" : settings?.model;
  if (!baseUrl || !model || (mode === "chat" && !key)) return Response.json({ error: mode === "chat" ? "Hermes Agent is not connected yet. Ask your workspace administrator to configure it." : "AI generation is not connected yet. Use a starter template or ask your administrator to connect a model." }, { status: 503 });
  let url: URL;
  try {
    if (mode === "image" && !/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error();
    url = new URL(mode === "image" ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` : `${baseUrl.replace(/\/$/, "")}/chat/completions`);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && url.protocol === "http:"))) throw new Error();
  } catch { return Response.json({ error: "The AI service URL is invalid. Production requires HTTPS." }, { status: 503 }); }

  const reserved = await convex.mutation(api.assist.reserveRequest, { boardId: boardId as Id<"boards"> }).catch(() => null);
  if (reserved === null) return Response.json({ error: "An organization member role is required to use Assist." }, { status: 403 });
  if (!reserved) return Response.json({ error: "Too many AI requests. Wait a minute and try again." }, { status: 429, headers: { "Retry-After": "60" } });

  try {
    if (mode === "image") {
      if (!key) return Response.json({ error: "Configure GEMINI_API_KEY to use Nano Banana." }, { status: 503 });
      const last = submittedMessages.at(-1)!.content;
      const parts = typeof last === "string" ? [{ text: last }] : last.map(part => part.type === "text" && "text" in part ? { text: part.text } : "image_url" in part ? { inlineData: { mimeType: part.image_url.url.split(";")[0].slice(5), data: part.image_url.url.split(",")[1] } } : { text: "" });
      const response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.any([request.signal, AbortSignal.timeout(50000)]), headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }) });
      if (!response.ok || !response.body) throw new Error("Image generation unavailable");
      const result = await boundedJson(response, 14_000_000) as { candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[] };
      const image = result.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;
      if (!image?.data || !["image/png", "image/jpeg", "image/webp"].includes(image.mimeType || "") || !/^[A-Za-z0-9+/=]+$/.test(image.data)) throw new Error("No valid generated image");
      return Response.json({ image: `data:${image.mimeType};base64,${image.data}`, message: "Generated with Nano Banana" }, { headers: { "Cache-Control": "no-store" } });
    }
    // Only the user's submitted messages leave the app. No board contents, IDs, or Clerk tokens are sent.
    const response = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.any([request.signal, AbortSignal.timeout(50000)]),
      headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model, stream: streaming, max_tokens: 1024, ...(mode === "generate" ? { response_format: { type: "json_object" } } : {}), ...(provider === "hermes" ? { model_options: { reasoning: { enabled: false } } } : {}), ...(mode === "generate" && process.env.AI_REASONING_EFFORT ? { reasoning_effort: process.env.AI_REASONING_EFFORT } : {}), messages: [
        { role: "system", content: mode === "generate"
          ? 'Create useful board content. Return only JSON: {"title":"short title","notes":["note text"]}. Return 1 to 40 concise notes. No markup, tools, or external actions.'
          : "You are the Flowboard workspace assistant. Help with planning and brainstorming. You cannot change boards or execute external actions. Answer in plain text. Do not use tools." },
        ...submittedMessages,
      ] }),
    });
    if (!response.ok) return Response.json({ error: response.status === 429 ? "The AI provider is busy. Try again shortly." : "The AI service could not complete the request. Try again." }, { status: response.status === 429 ? 429 : 502 });
    if (streaming) {
      if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("Streaming is unavailable");
      let bytes = 0;
      const bounded = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > 1_000_000) controller.error(new Error("Response exceeded limit")); else controller.enqueue(chunk); } }));
      return new Response(bounded, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
    }
    const completion = await boundedJson(response, 1_000_000);
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim() || content.length > 50000) throw new Error("Invalid response");
    return Response.json(mode === "generate" ? { board: parseGeneratedBoard(content) } : { message: content }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "The AI service took too long. Try a shorter prompt." : "The AI response was unavailable or invalid. Try again." }, { status: 502 });
  }
}
