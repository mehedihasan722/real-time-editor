import { boardTitleSchema } from "../src/lib/board-validation";
import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getActiveOrganizationId } from "../src/lib/organization-claim";
import { assertEditor } from "../src/lib/roles";

const images = [
  "/placeholders/1.svg",
  "/placeholders/2.svg",
  "/placeholders/3.svg",
  "/placeholders/4.svg",
  "/placeholders/5.svg",
  "/placeholders/6.svg",
  "/placeholders/7.svg",
  "/placeholders/8.svg",
  "/placeholders/9.svg",
  "/placeholders/10.svg",
];

const boardValidator = v.object({
  _id: v.id("boards"),
  _creationTime: v.number(),
  title: v.string(),
  orgId: v.string(),
  authorId: v.string(),
  authorName: v.string(),
  imageUrl: v.string(),
});

const displayName = (identity: {
  name?: string;
  nickname?: string;
  email?: string;
}) =>
  identity.name?.trim() ||
  identity.nickname?.trim() ||
  identity.email?.split("@")[0]?.trim() ||
  "Flowboard member";

const assertBoardOrganization = (
  identity: Record<string, unknown>,
  board: { orgId: string },
) => {
  if (getActiveOrganizationId(identity) !== board.orgId) {
    throw new Error("Board access denied");
  }
};

export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
  },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    if (getActiveOrganizationId(identity) !== args.orgId) {
      throw new Error("Organization access denied");
    }

    const title = boardTitleSchema.parse(args.title);
    assertEditor(identity);
    const randomImage = images[Math.floor(Math.random() * images.length)];

    const board = await ctx.db.insert("boards", {
      title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: displayName(identity),
      imageUrl: randomImage,
    });

    return board;
  },
});

export const remove = mutation({
  args: { id: v.id("boards") },
  returns: v.null(),

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    const board = await ctx.db.get(args.id);
    if (!board) return null;
    assertBoardOrganization(identity, board);
    assertEditor(identity);
    await ctx.db.delete(args.id);
    await ctx.scheduler.runAfter(0, internal.board.cleanupFavourites, { id: args.id });
    const jobId = await ctx.db.insert("roomCleanup", { roomId: args.id, attempts: 0, status: "pending" });
    await ctx.scheduler.runAfter(0, internal.board.cleanupRoom, { jobId });
    return null;
  },
});

export const cleanupFavourites = internalMutation({
  args: { id: v.id("boards") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const favourites = await ctx.db.query("userFavourites").withIndex("by_board", q => q.eq("boardId", id)).take(200);
    for (const favourite of favourites) await ctx.db.delete(favourite._id);
    if (favourites.length === 200) await ctx.scheduler.runAfter(0, internal.board.cleanupFavourites, { id });
    return null;
  },
});

export const getCleanupJob = internalQuery({
  args: { jobId: v.id("roomCleanup") },
  returns: v.union(v.object({ _id: v.id("roomCleanup"), _creationTime: v.number(), roomId: v.string(), attempts: v.number(), status: v.union(v.literal("pending"), v.literal("failed")), lastError: v.optional(v.string()) }), v.null()),
  handler: (ctx, { jobId }) => ctx.db.get(jobId),
});

export const finishCleanup = internalMutation({
  args: { jobId: v.id("roomCleanup"), error: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { jobId, error }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    if (!error) { await ctx.db.delete(jobId); return null; }
    const attempts = job.attempts + 1;
    await ctx.db.patch(jobId, { attempts, status: attempts >= 8 ? "failed" : "pending", lastError: error });
    if (attempts < 8) await ctx.scheduler.runAfter(Math.min(3600000, 30000 * 2 ** attempts), internal.board.cleanupRoom, { jobId });
    return null;
  },
});

export const cleanupRoom = internalAction({
  args: { jobId: v.id("roomCleanup") },
  returns: v.null(),
  handler: async (ctx, { jobId }): Promise<null> => {
    const job = await ctx.runQuery(internal.board.getCleanupJob, { jobId });
    if (!job) return null;
    let error: string | undefined;
    try {
      const secret = process.env.LIVEBLOCKS_SECRET_KEY;
      if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not configured on Convex");
      const response = await fetch(`https://api.liveblocks.io/v2/rooms/${encodeURIComponent(job.roomId)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(15000),
      });
      if (!response.ok && response.status !== 404) throw new Error(`Liveblocks deletion failed: HTTP ${response.status}`);
    } catch (cause) { error = cause instanceof Error ? cause.message : "Room cleanup failed"; }
    await ctx.runMutation(internal.board.finishCleanup, { jobId, ...(error ? { error } : {}) });
    return null;
  },
});

export const update = mutation({
  args: { id: v.id("boards"), title: v.string() },
  returns: v.null(),

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    const board = await ctx.db.get(args.id);
    if (!board) return null;
    assertBoardOrganization(identity, board);
    const title = boardTitleSchema.parse(args.title);
    assertEditor(identity);

    await ctx.db.patch(args.id, {
      title,
    });

    return null;
  },
});

export const favourite = mutation({
  args: { id: v.id("boards"), orgId: v.string() },
  returns: boardValidator,

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);
    if (!board) {
      throw new Error("Board not found");
    }
    assertBoardOrganization(identity, board);
    assertEditor(identity);
    if (board.orgId !== args.orgId) {
      throw new Error("Board does not belong to this organization");
    }

    const userId = identity.subject;

    const existingFavourite = await ctx.db
      .query("userFavourites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", userId).eq("boardId", board._id)
      )
      .unique();
    if (existingFavourite) {
      throw new Error("Board already favourited");
    }

    await ctx.db.insert("userFavourites", {
      userId,
      boardId: board._id,
      orgId: args.orgId,
    });

    return board;
  },
});

export const unfavourite = mutation({
  args: { id: v.id("boards") },
  returns: boardValidator,

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(args.id);
    if (!board) {
      throw new Error("Board not found");
    }
    assertBoardOrganization(identity, board);
    assertEditor(identity);

    const userId = identity.subject;

    const existingFavourite = await ctx.db
      .query("userFavourites")
      .withIndex(
        "by_user_board",
        (q) => q.eq("userId", userId).eq("boardId", board._id)
      )
      .unique();
    if (!existingFavourite) {
      throw new Error("Favourited board not found");
    }

    await ctx.db.delete(existingFavourite._id);

    return board;
  },
});

export const get = query({
  args: { id: v.id("boards") },
  returns: v.union(v.object({
    _id: v.id("boards"),
    _creationTime: v.number(),
    title: v.string(),
    orgId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    imageUrl: v.string(),
    isFavourite: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const board = await ctx.db.get(args.id);
    if (!board) return null;
    assertBoardOrganization(identity, board);
    const favourite = await ctx.db
      .query("userFavourites")
      .withIndex("by_user_board", (q) =>
        q.eq("userId", identity.subject).eq("boardId", board._id)
      )
      .unique();
    return { ...board, isFavourite: Boolean(favourite) };
  },
});
