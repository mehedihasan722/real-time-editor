import { v } from "convex/values";

export const boardFields = {
  _id: v.id("boards"),
  _creationTime: v.number(),
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
};
export const boardWithFavourite = v.object({ ...boardFields, isFavourite: v.boolean() });
