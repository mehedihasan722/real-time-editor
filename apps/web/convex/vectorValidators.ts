import { v } from "convex/values";
export const vectorFields = {
  type: v.union(v.literal("rectangle"), v.literal("ellipse"), v.literal("sticky"), v.literal("text"), v.literal("path")),
  x: v.number(), y: v.number(), width: v.number(), height: v.number(),
  fill: v.string(), stroke: v.string(), strokeWidth: v.number(), order: v.number(),
  text: v.string(), points: v.array(v.object({ x: v.number(), y: v.number() })),
};
export const vectorDocument = v.object({
  ...vectorFields, _id: v.id("canvas_layers"), _creationTime: v.number(),
  boardId: v.id("boards"), layerId: v.string(), version: v.number(), deleted: v.boolean(),
});
