import type { VectorCamera, VectorLayer } from "./types";
import { inViewport } from "./geometry";

export function drawLayer(ctx: CanvasRenderingContext2D, layer: VectorLayer, dark = false) {
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.fillStyle = layer.fill; ctx.strokeStyle = layer.stroke;
  ctx.lineWidth = layer.strokeWidth; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  if (layer.type === "ellipse") ctx.ellipse(layer.width / 2, layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
  else if (layer.type === "path") {
    layer.points.forEach((point, index) => { if (index) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); });
  } else if (layer.type !== "text") ctx.roundRect(0, 0, layer.width, layer.height, layer.type === "sticky" ? Math.min(12, layer.width / 2, layer.height / 2) : 0);
  if (layer.type !== "path" && layer.type !== "text") ctx.fill();
  if (layer.strokeWidth && layer.type !== "text") ctx.stroke();
  if ((layer.type === "sticky" || layer.type === "text") && layer.text) {
    ctx.beginPath(); ctx.rect(0, 0, layer.width, layer.height); ctx.clip();
    const components = layer.fill.match(/[\d.]+/g)?.map(Number) ?? [253, 230, 138, 1];
    const background = dark ? 17 : 248, alpha = components[3] ?? 1;
    const luminance = components.slice(0, 3).reduce((total, value, index) => {
      const channel = (value * alpha + background * (1 - alpha)) / 255;
      return total + [0.2126, 0.7152, 0.0722][index] * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    }, 0);
    ctx.fillStyle = layer.type === "sticky" ? luminance > 0.179 ? "#000000" : "#ffffff" : layer.fill;
    ctx.font = "16px system-ui, sans-serif"; ctx.textBaseline = "top";
    const padding = layer.type === "sticky" ? 14 : 0, available = Math.max(1, layer.width - padding * 2);
    let y = padding;
    for (const paragraph of layer.text.split("\n")) {
      let line = "";
      for (const character of paragraph) {
        if (line && ctx.measureText(line + character).width > available) { ctx.fillText(line, padding, y); y += 22; line = ""; }
        line += character;
        if (y > layer.height) break;
      }
      ctx.fillText(line, padding, y); y += 22;
      if (y > layer.height) break;
    }
  }
  ctx.restore();
}

export function renderScene(ctx: CanvasRenderingContext2D, layers: readonly (readonly [string, VectorLayer])[], camera: VectorCamera, width: number, height: number, dpr: number, dark: boolean, selected: readonly string[]) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = dark ? "#0b1120" : "#f8fafc"; ctx.fillRect(0, 0, width, height);
  const spacing = 32 * camera.zoom;
  if (spacing >= 12) {
    ctx.fillStyle = dark ? "#39475f" : "#cbd5e1";
    for (let x = ((camera.panX % spacing) + spacing) % spacing; x < width; x += spacing)
      for (let y = ((camera.panY % spacing) + spacing) % spacing; y < height; y += spacing) ctx.fillRect(x, y, 1, 1);
  }
  ctx.setTransform(dpr * camera.zoom, 0, 0, dpr * camera.zoom, dpr * camera.panX, dpr * camera.panY);
  const selection = new Set(selected);
  for (const [id, layer] of layers) {
    if (!inViewport(layer, camera, width, height)) continue;
    drawLayer(ctx, layer, dark);
    if (selection.has(id)) {
      ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2 / camera.zoom;
      ctx.strokeRect(layer.x - 4 / camera.zoom, layer.y - 4 / camera.zoom, layer.width + 8 / camera.zoom, layer.height + 8 / camera.zoom);
    }
  }
}
