import { type ClassValue, clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";
import {
  Camera,
  Color,
  Layer,
  LayerType,
  PathLayer,
  Point,
  Side,
  XYWH,
} from "../types/canvas";

const COLORS = [
  "#FF0000", // Red
  "#00FF00", // Lime
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FF4500", // OrangeRed
  "#FFD700", // Gold
  "#800080", // Purple
  "#008000", // Green
  "#800000", // Maroon
  "#008080", // Teal
  "#FFA500", // Orange
  "#4B0082", // Indigo
  "#FF1493", // DeepPink
  "#00FF7F", // SpringGreen
  "#8A2BE2", // BlueViolet
  "#D2691E", // Chocolate
  "#7FFF00", // Chartreuse
  "#BA55D3", // MediumOrchid
  "#8B4513", // SaddleBrown
  "#9932CC", // DarkOrchid
  "#2E8B57", // SeaGreen
  "#FF6347", // Tomato
  "#20B2AA", // LightSeaGreen
  "#1E90FF", // DodgerBlue
  "#7FFFD4", // Aquamarine
  "#FF7F50", // Coral
  "#B0E0E6", // PowderBlue
  "#800000", // Maroon
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

export function pointerEventToCanvasPoint(
  e: React.PointerEvent,
  camera: Camera,
  zoom = 1
) {
  return {
    x: (Math.round(e.clientX) - camera.x) / zoom,
    y: (Math.round(e.clientY) - camera.y) / zoom,
  };
}
/*
export function colorToCss(color: Color) {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}
*/

export function colorToCss(color: Color) {
  // Convert each component to its hexadecimal representation
  const rHex = color.r.toString(16).padStart(2, "0");
  const gHex = color.g.toString(16).padStart(2, "0");
  const bHex = color.b.toString(16).padStart(2, "0");
  const aHex = Math.round(color.a * 255)
    .toString(16)
    .padStart(2, "0"); // Convert alpha to hexadecimal

  // Construct the CSS string for RGBA color
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function resizeBounds(bounds: XYWH, corner: Side, point: Point): XYWH {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width);
    result.width = Math.abs(bounds.x + bounds.width - point.x);
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x);
    result.width = Math.abs(point.x - bounds.x);
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height);
    result.height = Math.abs(bounds.y + bounds.height - point.y);
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y);
    result.height = Math.abs(point.y - bounds.y);
  }

  return result;
}

export function findIntersectingLayersWithRectangle(
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  a: Point,
  b: Point
) {
  const rect = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };

  const ids = [];

  for (const layerId of layerIds) {
    const layer = layers.get(layerId);

    if (layer == null) {
      continue;
    }

    const { x, y, height, width } = layer;

    if (
      rect.x + rect.width > x &&
      rect.x < x + width &&
      rect.y + rect.height > y &&
      rect.y < y + height
    ) {
      ids.push(layerId);
    }
  }

  return ids;
}

export function getContrastingTextColor(color: Color) {
  const luminance =
    (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) * color.a;
  return luminance > 182 ? "black" : "white";
}

export function penPointsToPathLayer(
  points: number[][],
  color: Color,
  strokeWidth = 8,
  drawingTool: PathLayer["drawingTool"] = "pen"
): PathLayer {
  if (points.length < 2) {
    throw new Error("Cannot transform points with less than 2 points");
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  const preparedPoints = drawingTool === "style" ? smoothDrawingPoints(points) : points;

  for (const point of preparedPoints) {
    const [x, y] = point;

    if (left > x) {
      left = x;
    }

    if (top > y) {
      top = y;
    }

    if (right < x) {
      right = x;
    }

    if (bottom < y) {
      bottom = y;
    }
  }

  return {
    type: LayerType.Path,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    fill: color,
    points: preparedPoints.map(([x, y, pressure]) => [x - left, y - top, pressure]),
    strokeWidth,
    drawingTool,
  };
}

function smoothDrawingPoints(points: number[][]) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  const directDistance = Math.hypot(last[0] - first[0], last[1] - first[1]);
  const travelledDistance = points.slice(1).reduce(
    (distance, point, index) =>
      distance + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]),
    0,
  );

  if (directDistance > 24 && directDistance / Math.max(travelledDistance, 1) > 0.94) {
    return [first, last];
  }

  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;
    const previous = points[index - 1];
    const next = points[index + 1];
    return [
      (previous[0] + point[0] * 2 + next[0]) / 4,
      (previous[1] + point[1] * 2 + next[1]) / 4,
      point[2] ?? 0.5,
    ];
  });
}

export function isPointNearPath(layer: PathLayer, point: Point, radius: number) {
  const points = layer.points.map(([x, y]) => ({ x: x + layer.x, y: y + layer.y }));
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const progress = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    const closestX = start.x + progress * dx;
    const closestY = start.y + progress * dy;
    if (Math.hypot(point.x - closestX, point.y - closestY) <= radius) return true;
  }
  return false;
}

export function erasePathPortion(layer: PathLayer, point: Point, radius: number) {
  const sampled: number[][] = [];
  for (let index = 1; index < layer.points.length; index += 1) {
    const start = layer.points[index - 1];
    const end = layer.points[index];
    const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const steps = Math.max(1, Math.ceil(distance / Math.max(3, radius / 2)));
    for (let step = index === 1 ? 0 : 1; step <= steps; step += 1) {
      const progress = step / steps;
      sampled.push([
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
        (start[2] ?? 0.5) + ((end[2] ?? 0.5) - (start[2] ?? 0.5)) * progress,
      ]);
    }
  }

  let touched = false;
  const segments: number[][][] = [];
  let current: number[][] = [];
  for (const sample of sampled) {
    const erased = Math.hypot(sample[0] + layer.x - point.x, sample[1] + layer.y - point.y) <= radius;
    if (erased) {
      touched = true;
      if (current.length >= 2) segments.push(current);
      current = [];
    } else {
      current.push(sample);
    }
  }
  if (current.length >= 2) segments.push(current);
  return touched ? segments : null;
}

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}
