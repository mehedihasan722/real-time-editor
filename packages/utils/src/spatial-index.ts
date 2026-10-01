import type { Layer, XYWH } from "@flowboard/types/canvas";
const intersects = (a: XYWH, b: XYWH) => a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
export class SpatialIndex {
  private cells = new Map<string, Set<string>>();
  private bounds = new Map<string, XYWH>();
  private global = new Set<string>();
  constructor(entries: readonly (readonly [string, Layer])[], private cellSize = 512) {
    for (const [id, layer] of entries) {
      const angle = ("rotation" in layer ? layer.rotation || 0 : 0) * Math.PI / 180;
      const width = Math.abs(layer.width * Math.cos(angle)) + Math.abs(layer.height * Math.sin(angle));
      const height = Math.abs(layer.width * Math.sin(angle)) + Math.abs(layer.height * Math.cos(angle));
      const box = { x: layer.x + layer.width / 2 - width / 2 - 16, y: layer.y + layer.height / 2 - height / 2 - 16, width: width + 32, height: height + 32 };
      this.bounds.set(id, box);
      const keys = this.keys(box);
      if (!keys) { this.global.add(id); continue; }
      for (const key of keys) { let cell = this.cells.get(key); if (!cell) { cell = new Set(); this.cells.set(key, cell); } cell.add(id); }
    }
  }
  private keys(box: XYWH): string[] | null {
    const left = Math.floor(box.x / this.cellSize), right = Math.floor((box.x + box.width) / this.cellSize);
    const top = Math.floor(box.y / this.cellSize), bottom = Math.floor((box.y + box.height) / this.cellSize);
    if ((right - left + 1) * (bottom - top + 1) > 256) return null;
    const keys: string[] = [];
    for (let x = left; x <= right; x++) for (let y = top; y <= bottom; y++) keys.push(`${x}:${y}`);
    return keys;
  }
  query(viewport: XYWH): Set<string> {
    const keys = this.keys(viewport), candidates = new Set(this.global);
    if (!keys) for (const id of this.bounds.keys()) candidates.add(id);
    else for (const key of keys) for (const id of this.cells.get(key) || []) candidates.add(id);
    return new Set([...candidates].filter(id => intersects(this.bounds.get(id)!, viewport)));
  }
}
