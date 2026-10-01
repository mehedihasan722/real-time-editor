import { v } from "convex/values";

export const boardFields = {
  _id: v.id("boards"),
  _creationTime: v.number(),
  title: v.string(),
  orgId: v.string(),
  authorId: v.string(),
  authorName: v.string(),
  imageUrl: v.string(),
};
export const boardWithFavourite = v.object({ ...boardFields, isFavourite: v.boolean() });
