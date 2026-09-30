import { auth, currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { z } from "zod";
import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

const requestSchema = z.object({
  room: z.string().trim().min(1).max(128),
});

export async function POST(request: Request) {
  if (!publicEnv.success || !serverEnv.success) {
    return Response.json({ error: "Workspace services are not configured." }, { status: 503 });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Cross-site request denied." }, { status: 403 });
  }

  const authorization = await auth();
  const user = await currentUser();

  if (!authorization.userId || !authorization.orgId || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid room" }, { status: 400 });
  }
  const { room } = parsed.data;
  const audience = authorization.sessionClaims?.aud;
  const usesConvexSession =
    audience === "convex" ||
    (Array.isArray(audience) && audience.includes("convex"));
  const token = usesConvexSession
    ? await authorization.getToken()
    : await authorization.getToken({ template: "convex" });
  if (!token) return new Response("Unauthorized", { status: 403 });

  const convex = new ConvexHttpClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);
  const board = await convex
    .query(api.board.get, { id: room as Id<"boards"> })
    .catch(() => null);

  if (board?.orgId !== authorization.orgId) {
    return new Response("Unauthorized", { status: 403 });
  }

  const userInfo = {
    name: user.firstName || "Anonymous",
    picture: user.imageUrl,
  };

  const liveblocks = new Liveblocks({ secret: serverEnv.data.LIVEBLOCKS_SECRET_KEY });
  const session = liveblocks.prepareSession(user.id, { userInfo });

  if (room) {
    session.allow(room, session.FULL_ACCESS);
  }

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
