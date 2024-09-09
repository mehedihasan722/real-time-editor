import { type ClassValue, clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Camera, Color } from "../types/canvas";

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}

export function pointerEventToCanvasPoint(
  e: React.PointerEvent,
  camera: Camera
) {
  return {
    x: Math.round(e.clientX) - camera.x,
    y: Math.round(e.clientY) - camera.y,
  };
}

export function colorToCss(color: Color) {
  return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
}

/*export function colorToCss(color: Color) {
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
*/
