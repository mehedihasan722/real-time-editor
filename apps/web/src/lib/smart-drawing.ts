import { Color, DiagramShapeKind, LayerType, ShapeLayer } from "@/types/canvas";

type XY = [number, number];
const distance = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function sample(points: XY[], count = 80): XY[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const total = lengths.at(-1)!;
  let segment = 1;
  return Array.from({ length: count }, (_, index) => {
    const target = total * index / (count - 1);
    while (segment < points.length - 1 && lengths[segment] < target) segment++;
    const ratio = (target - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1] || 1);
    return [points[segment - 1][0] + (points[segment][0] - points[segment - 1][0]) * ratio, points[segment - 1][1] + (points[segment][1] - points[segment - 1][1]) * ratio];
  });
}
const ellipse = (cy: number, ry: number, start: number, end: number): XY[] => Array.from({ length: 41 }, (_, i) => {
  const angle = start + (end - start) * i / 40;
  return [.5 + .5 * Math.cos(angle), cy + ry * Math.sin(angle)];
});
const templates: { shape: DiagramShapeKind; points: XY[]; rotation?: number }[] = [
  { shape: "rectangle", points: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] },
  { shape: "circle", points: ellipse(.5, .5, 0, Math.PI * 2) },
  { shape: "diamond", points: [[.5, 0], [1, .5], [.5, 1], [0, .5], [.5, 0]] },
  { shape: "hexagon", points: [[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5], [.25, 0]] },
  { shape: "database", points: [...ellipse(.15, .15, Math.PI, Math.PI * 2), [1, .85], ...ellipse(.85, .15, 0, Math.PI), [0, .15], ...ellipse(.15, .15, Math.PI, 0)] },
  ...[0, 90, 180, 270].map(rotation => ({ shape: "triangle" as const, rotation, points: ([[.5, 0], [1, 1], [0, 1], [.5, 0]] as XY[]).map(([x, y]): XY => {
    const angle = rotation * Math.PI / 180;
    return [.5 + (x - .5) * Math.cos(angle) - (y - .5) * Math.sin(angle), .5 + (x - .5) * Math.sin(angle) + (y - .5) * Math.cos(angle)];
  }) })),
];
const sampledTemplates = templates.map(template => ({ ...template, points: sample(template.points) }));

/** Recognize one completed stroke; uncertain marks remain freehand. */
export function recognizeDrawing(points: number[][], strokeColor: Color, strokeWidth: number): ShapeLayer | null {
  if (points.length < 4 || points.some(point => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) return null;
  const raw: XY[] = points.map(point => [point[0], point[1]]);
  let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity;
  for (const [px, py] of raw) { x = Math.min(x, px); y = Math.min(y, py); right = Math.max(right, px); bottom = Math.max(bottom, py); }
  const width = right - x;
  const height = bottom - y;
  const diagonal = Math.hypot(width, height);
  const direct = distance(raw[0], raw.at(-1)!);
  const travelled = raw.slice(1).reduce((sum, point, i) => sum + distance(raw[i], point), 0);
  const base = { type: LayerType.Shape as const, x, y, width, height, fill: { r: 255, g: 255, b: 255, a: 0 }, strokeColor, strokeWidth };
  if (diagonal < 24) return null;
  if (direct > 24 && travelled / direct < 1.08) {
    const center = [(raw[0][0] + raw.at(-1)![0]) / 2, (raw[0][1] + raw.at(-1)![1]) / 2];
    return { ...base, shape: "line", x: center[0] - direct / 2 - 4, y: center[1] - 4, width: direct + 8, height: 8, rotation: Math.atan2(raw.at(-1)![1] - raw[0][1], raw.at(-1)![0] - raw[0][0]) * 180 / Math.PI };
  }
  if (width < 16 || height < 16) return null;
  const spaced = [raw[0]];
  for (const point of raw.slice(1)) {
    if (distance(point, spaced.at(-1)!) >= diagonal * .02) spaced.push(point);
  }
  spaced.push(raw.at(-1)!);
  const normalized = sample(spaced).map(([px, py]): XY => [(px - x) / width, (py - y) / height]);
  const candidates = sampledTemplates.filter(template => direct <= diagonal * .3 || (template.shape === "database" && raw[0][1] < y + height * .4 && raw.at(-1)![1] < y + height * .4)).map(template => {
    const distances = normalized.map(point => Math.min(...template.points.map(target => distance(point, target))));
    const coverage = template.points.map(point => Math.min(...normalized.map(target => distance(point, target))));
    const score = (distances.reduce((sum, value) => sum + value, 0) + coverage.reduce((sum, value) => sum + value, 0)) / 160;
    return { ...template, score, worst: Math.max(...distances, ...coverage) };
  }).sort((a, b) => a.score - b.score);
  const best = candidates[0];
  if (!best || best.score > .065 || best.worst > .18 || (candidates[1] && candidates[1].score - best.score < .006)) return null;
  // Rotating a rectangular bounding box swaps dimensions for sideways triangles.
  const sideways = best.rotation === 90 || best.rotation === 270;
  return { ...base, shape: best.shape, rotation: best.rotation ?? 0, ...(sideways ? { x: x + (width - height) / 2, y: y + (height - width) / 2, width: height, height: width } : {}) };
}
