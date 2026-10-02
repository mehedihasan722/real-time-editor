import type { VectorCamera, VectorLayer, VectorPoint } from "./types";

export function screenToCanvas(point: VectorPoint, camera: VectorCamera): VectorPoint {
  return { x: (point.x - camera.panX) / camera.zoom, y: (point.y - camera.panY) / camera.zoom };
}
export function zoomAt(camera: VectorCamera, pivot: VectorPoint, delta: number): VectorCamera {
  const world = screenToCanvas(pivot, camera);
  const zoom = Math.min(8, Math.max(0.1, camera.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002)));
  return { zoom, panX: pivot.x - world.x * zoom, panY: pivot.y - world.y * zoom };
}
export function bounds(points: readonly VectorPoint[]) {
  if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const { x, y } of points) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function segmentDistanceSquared(point: VectorPoint, a: VectorPoint, b: VectorPoint) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = dx || dy ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy))) : 0;
  return (point.x - a.x - t * dx) ** 2 + (point.y - a.y - t * dy) ** 2;
}
export function simplifyStroke(points: readonly VectorPoint[], tolerance: number): VectorPoint[] {
  if (points.length <= 2) return [...points];
  const keep = new Set([0, points.length - 1]), stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maximum = tolerance ** 2, index = -1;
    for (let i = start + 1; i < end; i++) {
      const distance = segmentDistanceSquared(points[i], points[start], points[end]);
      if (distance > maximum) { maximum = distance; index = i; }
    }
    if (index !== -1) { keep.add(index); stack.push([start, index], [index, end]); }
  }
  return [...keep].sort((a, b) => a - b).map(index => ({ ...points[index] }));
}
export function processSketch(points: readonly VectorPoint[], tolerance: number, recognize: boolean) {
  const box = bounds(points), simplified = simplifyStroke(points, tolerance);
  const threshold = Math.max(tolerance * 3, Math.min(box.width, box.height) * 0.06);
  const closed = points.length >= 8 && segmentDistanceSquared(points[0], points.at(-1)!, points.at(-1)!) <= threshold ** 2;
  const edges = [false, false, false, false];
  let onEdge = 0;
  for (const point of points) {
    const distances = [Math.abs(point.x - box.x), Math.abs(point.y - box.y), Math.abs(point.x - box.x - box.width), Math.abs(point.y - box.y - box.height)];
    if (Math.min(...distances) <= threshold) onEdge++;
    distances.forEach((distance, i) => { if (distance <= threshold) edges[i] = true; });
  }
  const rectangle = recognize && closed && box.width > threshold * 4 && box.height > threshold * 4 && edges.every(Boolean) && onEdge / points.length > 0.95;
  return { ...box, type: rectangle ? "rectangle" as const : "path" as const, points: rectangle ? [] : simplified.map(point => ({ x: point.x - box.x, y: point.y - box.y })) };
}
export function hitLayer(layer: VectorLayer, point: VectorPoint, zoom: number) {
  const x = point.x - layer.x, y = point.y - layer.y, margin = 6 / zoom + layer.strokeWidth / 2;
  if (x < -margin || y < -margin || x > layer.width + margin || y > layer.height + margin) return false;
  if (layer.type === "ellipse") return ((x - layer.width / 2) / Math.max(0.5, layer.width / 2 + margin)) ** 2 + ((y - layer.height / 2) / Math.max(0.5, layer.height / 2 + margin)) ** 2 <= 1;
  if (layer.type === "path") {
    for (let i = 1; i < layer.points.length; i++) if (segmentDistanceSquared({ x, y }, layer.points[i - 1], layer.points[i]) <= margin ** 2) return true;
    return false;
  }
  return true;
}
export function inViewport(layer: VectorLayer, camera: VectorCamera, width: number, height: number) {
  const left = -camera.panX / camera.zoom, top = -camera.panY / camera.zoom, margin = layer.strokeWidth / 2 + 4 / camera.zoom;
  return layer.x + layer.width + margin >= left && layer.y + layer.height + margin >= top && layer.x - margin <= left + width / camera.zoom && layer.y - margin <= top + height / camera.zoom;
}
