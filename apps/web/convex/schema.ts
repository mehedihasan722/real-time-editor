import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";
import { vectorFields } from "./vectorValidators";

export default defineSchema({
  canvas_layers: defineTable({ ...vectorFields, boardId: v.id("boards"), layerId: v.string(), version: v.number(), deleted: v.boolean() })
    .index("by_boardId", ["boardId"])
    .index("by_boardId_layerId", ["boardId", "layerId"]),
  assistQuota: defineTable({ orgId: v.string(), userId: v.string(), window: v.number(), count: v.number() }).index("by_org_user", ["orgId", "userId"]),
  roomCleanup: defineTable({
    roomId: v.string(),
    attempts: v.number(),
    status: v.union(v.literal("pending"), v.literal("failed")),
    lastError: v.optional(v.string()),
  }).index("by_status", ["status"]),
  boards: defineTable({
    title: v.string(),
    orgId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    imageUrl: v.string(),
    createdBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    lastModified: v.optional(v.number()),
    canvasLayerCount: v.optional(v.number()),
    canvasRecordCount: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId"],
    }),
  userFavourites: defineTable({
    orgId: v.string(),
    userId: v.string(),
    boardId: v.id("boards"),
  })
    .index("by_board", ["boardId"])
    .index("by_user_org", ["userId", "orgId"])
    .index("by_user_board", ["userId", "boardId"])
    .index("by_user_board_org", ["userId", "boardId", "orgId"]),
});
