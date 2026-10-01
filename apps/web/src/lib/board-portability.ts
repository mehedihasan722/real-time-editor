import { z } from "zod";
import { LayerType, type Layer } from "@/types/canvas";

export const MAX_LAYERS = 5000;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 256 * 1024;
const number = z.number().finite();
const color = z.object({ r: number.min(0).max(255), g: number.min(0).max(255), b: number.min(0).max(255), a: number.min(0).max(1) });
const common = {
  x: number.min(-1000000).max(1000000), y: number.min(-1000000).max(1000000),
  width: number.min(0).max(100000), height: number.min(0).max(100000),
  fill: color, value: z.string().max(20000).optional(),
};
const workspaceNote = { requirementSection: z.enum(["problem", "goals", "requirements", "metrics", "risks", "discussion"]).optional(), requirementPriority: z.enum(["must", "should", "could"]).optional(), checkIn: z.object({ owner: z.string().max(200), week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mood: z.enum(["", "Amazing", "Happy", "Neutral", "Sad", "Not well"]), priorities: z.array(z.object({ text: z.string().max(500), done: z.boolean() })).max(30), achievements: z.array(z.string().max(500)).max(30), issues: z.string().max(2000), objectives: z.array(z.object({ title: z.string().max(200), progress: number.min(0).max(100), status: z.enum(["on-track", "at-risk", "off-track"]) })).max(20) }).optional(), roadmap: z.boolean().optional(), description: z.string().max(2000).optional(), tags: z.string().max(200).optional(), status: z.enum(["planned", "in-progress", "done"]).optional(), lane: z.enum(["positive", "improve", "action"]).optional(), completed: z.boolean().optional(), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), project: z.string().max(100).optional() };
const shape = z.enum(["line", "arrow", "elbow-arrow", "block-arrow", "divider", "rectangle", "rounded", "circle", "triangle", "diamond", "star", "arrow-right", "arrow-left", "hexagon", "database", "cloud", "plus", "document", "parallelogram", "terminator", "actor", "server", "callout"]);
export const layerSchema = z.discriminatedUnion("type", [
  z.object({ ...common, type: z.literal(LayerType.Rectangle) }),
  z.object({ ...common, type: z.literal(LayerType.Ellipse) }),
  z.object({ ...common, type: z.literal(LayerType.Text) }),
  z.object({ ...common, type: z.literal(LayerType.Path), points: z.array(z.array(number).min(2).max(3)).max(10000), strokeWidth: number.min(1).max(100).optional(), drawingTool: z.enum(["pen", "marker", "style"]).optional() }),
  z.object({ ...common, ...workspaceNote, type: z.literal(LayerType.Note), author: z.string().max(200).optional(), fontFamily: z.enum(["arial", "calibri", "times", "georgia", "verdana", "courier", "comic"]).optional(), fontSize: z.enum(["small", "medium", "large"]).optional(), bold: z.boolean().optional(), strike: z.boolean().optional(), list: z.boolean().optional(), link: z.string().url().refine(value => /^https?:\/\//i.test(value)).optional(), rotation: number.min(-3600).max(3600).optional() }),
  z.object({ ...common, type: z.literal(LayerType.Shape), shape, strokeColor: color.optional(), strokeWidth: number.min(1).max(100).optional(), rotation: number.min(-3600).max(3600).optional() }),
  z.object({ ...common, type: z.literal(LayerType.Sticker), value: z.string().max(1000) }),
  z.object({ ...common, type: z.literal(LayerType.Image), src: z.string().max(MAX_IMAGE_BYTES * 2).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/), alt: z.string().max(200) }),
]);
export const boardFileSchema = z.object({ version: z.literal(1), layers: z.array(layerSchema).max(MAX_LAYERS) });

export function parseBoardFile(text: string): Layer[] {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new Error("Board files must be smaller than 10 MB.");
  return boardFileSchema.parse(JSON.parse(text)).layers;
}

export function getBoardBounds(layers: readonly Layer[]) {
  if (!layers.length) return { x: 0, y: 0, width: 800, height: 600 };
  const corners = layers.flatMap(layer => {
    const angle = ("rotation" in layer ? layer.rotation ?? 0 : 0) * Math.PI / 180;
    const cx = layer.x + layer.width / 2, cy = layer.y + layer.height / 2;
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sy]) => ({
      x: cx + sx * layer.width / 2 * Math.cos(angle) - sy * layer.height / 2 * Math.sin(angle),
      y: cy + sx * layer.width / 2 * Math.sin(angle) + sy * layer.height / 2 * Math.cos(angle),
    }));
  });
  const x = Math.min(...corners.map(p => p.x)) - 40, y = Math.min(...corners.map(p => p.y)) - 40;
  return { x, y, width: Math.max(1, Math.max(...corners.map(p => p.x)) - x + 40), height: Math.max(1, Math.max(...corners.map(p => p.y)) - y + 40) };
}
