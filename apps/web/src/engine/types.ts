export type VectorPoint = { x: number; y: number };
export type VectorCamera = { panX: number; panY: number; zoom: number };
export type VectorTool = "select" | "pan" | "rectangle" | "ellipse" | "sticky" | "text" | "path";
export type VectorLayer = {
  type: Exclude<VectorTool, "select" | "pan">;
  x: number; y: number; width: number; height: number;
  fill: string; stroke: string; strokeWidth: number;
  order: number; version: number;
  text: string; points: VectorPoint[];
};
export const VECTOR_LIMITS = { layers: 5000, records: 20000, points: 2048, coordinate: 1_000_000, dimension: 100_000, text: 4096 } as const;

export function isRenderableLayer(layer: VectorLayer): boolean {
  return Boolean(layer && typeof layer === "object") && ["rectangle", "ellipse", "sticky", "text", "path"].includes(layer.type) &&
    [layer.x, layer.y, layer.width, layer.height, layer.order, layer.strokeWidth, layer.version].every(Number.isFinite) &&
    Math.abs(layer.x) <= VECTOR_LIMITS.coordinate && Math.abs(layer.y) <= VECTOR_LIMITS.coordinate &&
    layer.width >= 0 && layer.height >= 0 && layer.width <= VECTOR_LIMITS.dimension && layer.height <= VECTOR_LIMITS.dimension &&
    layer.strokeWidth >= 0 && layer.strokeWidth <= 64 && typeof layer.fill === "string" && layer.fill.length <= 64 &&
    typeof layer.stroke === "string" && layer.stroke.length <= 64 && typeof layer.text === "string" && layer.text.length <= VECTOR_LIMITS.text &&
    Array.isArray(layer.points) && layer.points.length <= VECTOR_LIMITS.points &&
    layer.points.every(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
}
