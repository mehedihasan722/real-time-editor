import { v, ConvexError } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { customCtx, customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { query, mutation, internalMutation, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { vectorDocument, vectorFields } from "./vectorValidators";
import { getActiveOrganizationId } from "../src/lib/organization-claim";
import { assertEditor } from "../src/lib/roles";
import { VECTOR_LIMITS, type VectorLayer } from "../src/engine/types";
import type { Id } from "./_generated/dataModel";

async function organizationContext(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const orgId = identity && getActiveOrganizationId(identity);
  if (!identity || !orgId) throw new ConvexError("An active organization is required.");
  return { identity, orgId };
}
const organizationQuery = customQuery(query, customCtx(organizationContext));
const organizationMutation = customMutation(mutation, customCtx(organizationContext));
async function authorizedBoard(ctx: QueryCtx & { orgId: string }, boardId: Id<"boards">) {
  const board = await ctx.db.get(boardId);
  if (!board || board.orgId !== ctx.orgId) throw new ConvexError("Board access denied.");
  return board;
}

export const getBoardLayers = organizationQuery({
  args: { boardId: v.id("boards"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(vectorDocument),
  handler: async (ctx, { boardId, paginationOpts }) => {
    await authorizedBoard(ctx, boardId);
    return ctx.db.query("canvas_layers").withIndex("by_boardId", q => q.eq("boardId", boardId))
      .paginate({ ...paginationOpts, numItems: Math.min(50, Math.max(1, paginationOpts.numItems)) });
  },
});

export function validateVector(layer: Omit<VectorLayer, "version">) {
  for (const value of [layer.x, layer.y, layer.width, layer.height, layer.order, layer.strokeWidth]) {
    if (!Number.isFinite(value)) throw new ConvexError("Layer values must be finite.");
  }
  if (Math.abs(layer.x) > VECTOR_LIMITS.coordinate || Math.abs(layer.y) > VECTOR_LIMITS.coordinate ||
    layer.width < 0 || layer.height < 0 || layer.width > VECTOR_LIMITS.dimension || layer.height > VECTOR_LIMITS.dimension ||
    layer.strokeWidth < 0 || layer.strokeWidth > 64 || Math.abs(layer.order) > Number.MAX_SAFE_INTEGER) throw new ConvexError("Layer geometry exceeds supported limits.");
  const rgba = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(0(?:\.\d+)?|1(?:\.0+)?)\)$/;
  for (const color of [layer.fill, layer.stroke]) {
    if (color.length > 64) throw new ConvexError("Color exceeds supported limits.");
    const match = rgba.exec(color);
    if (!match || match.slice(1, 4).some(value => Number(value) > 255)) throw new ConvexError("Colors must be valid RGBA strings.");
  }
  if (layer.text.length > VECTOR_LIMITS.text || layer.points.length > VECTOR_LIMITS.points) throw new ConvexError("Layer content exceeds supported limits.");
  for (const point of layer.points) if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > layer.width || point.y > layer.height) throw new ConvexError("Path points must lie within the layer bounds.");
  if (layer.type === "path" && layer.points.length < 2) throw new ConvexError("Paths require at least two points.");
  if (layer.type !== "path" && layer.points.length !== 0) throw new ConvexError("Only paths may contain points.");
}

export const commitLayers = organizationMutation({
  args: { boardId: v.id("boards"), changes: v.array(v.union(v.object({
    layerId: v.string(), expectedVersion: v.number(), layer: v.union(v.object(vectorFields), v.null()),
  }), v.object({ layerId: v.string(), expectedVersion: v.number(), position: v.object({ x: v.number(), y: v.number() }) }))) },
  returns: v.array(v.object({ layerId: v.string(), version: v.number() })),
  handler: async (ctx, { boardId, changes }) => {
    assertEditor(ctx.identity);
    const board = await authorizedBoard(ctx, boardId);
    if (!changes.length || changes.length > 100 || new Set(changes.map(change => change.layerId)).size !== changes.length) throw new ConvexError("Commit must contain 1–100 unique layers.");
    let count = board.canvasLayerCount ?? 0;
    if (board.canvasRecordCount === undefined || board.canvasLayerCount === undefined) {
      const existing = await ctx.db.query("canvas_layers").withIndex("by_boardId", q => q.eq("boardId", boardId)).take(1);
      if (existing.length) throw new ConvexError("Layer counters require migration before editing this board.");
    }
    let records = board.canvasRecordCount ?? 0;
    const result: { layerId: string; version: number }[] = [];
    for (const change of changes) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(change.layerId) || !Number.isSafeInteger(change.expectedVersion) || change.expectedVersion < 0 || change.expectedVersion >= Number.MAX_SAFE_INTEGER) throw new ConvexError("Invalid layer identifier or version.");
      const previous = await ctx.db.query("canvas_layers").withIndex("by_boardId_layerId", q => q.eq("boardId", boardId).eq("layerId", change.layerId)).unique();
      if ((previous?.version ?? 0) !== change.expectedVersion) throw new ConvexError("This layer changed in another session. Please retry your edit.");
      let layer: Omit<VectorLayer, "version"> | null;
      if ("position" in change) {
        if (!previous || previous.deleted) throw new ConvexError("Cannot move a missing layer.");
        const { type, width, height, fill, stroke, strokeWidth, order, text, points } = previous;
        layer = { type, ...change.position, width, height, fill, stroke, strokeWidth, order, text, points };
      } else layer = change.layer;
      if (!layer && !previous) throw new ConvexError("Cannot delete a missing layer.");
      const version = change.expectedVersion + 1;
      if (layer) {
        validateVector(layer);
        if (!previous || previous.deleted) count++;
        const value = { ...layer, boardId, layerId: change.layerId, version, deleted: false };
        if (previous) await ctx.db.replace(previous._id, value);
        else { records++; await ctx.db.insert("canvas_layers", value); }
      } else if (previous) {
        if (!previous.deleted) count--;
        await ctx.db.patch(previous._id, { deleted: true, version, text: "", points: [] });
      }
      result.push({ layerId: change.layerId, version });
    }
    if (count > VECTOR_LIMITS.layers) throw new ConvexError("This board has reached its 5,000-layer limit.");
    if (records > VECTOR_LIMITS.records) throw new ConvexError("This board has reached its layer history limit. Create another board to continue.");
    await ctx.db.patch(boardId, { canvasLayerCount: count, canvasRecordCount: records, lastModified: Date.now() });
    return result;
  },
});

export const cleanupLayers = internalMutation({
  args: { boardId: v.id("boards") }, returns: v.null(),
  handler: async (ctx, { boardId }) => {
    const layers = await ctx.db.query("canvas_layers").withIndex("by_boardId", q => q.eq("boardId", boardId)).take(200);
    for (const layer of layers) await ctx.db.delete(layer._id);
    if (layers.length === 200) await ctx.scheduler.runAfter(0, internal.vector.cleanupLayers, { boardId });
    return null;
  },
});
