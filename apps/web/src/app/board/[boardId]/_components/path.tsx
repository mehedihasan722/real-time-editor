import { getSvgPathFromStroke } from "@/lib/utils";
import getStroke from "perfect-freehand";
import React from "react";

interface PathProps {
  x: number;
  y: number;
  points: number[][];
  fill: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  stroke?: string;
  strokeWidth?: number;
  drawingTool?: "pen" | "marker" | "style";
}

const Path = ({ x, y, points, fill, onPointerDown, stroke, strokeWidth = 8, drawingTool = "pen" }: PathProps) => {
  return (
    <path
      className="drop-shadow-md"
      onPointerDown={onPointerDown}
      d={getSvgPathFromStroke(
        getStroke(points, {
          size: drawingTool === "marker" ? strokeWidth * 1.8 : strokeWidth,
          thinning: drawingTool === "marker" ? 0 : drawingTool === "style" ? -0.35 : 0.5,
          smoothing: drawingTool === "style" ? 0.72 : 0.5,
          streamline: drawingTool === "style" ? 0.72 : 0.5,
        })
      )}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      x={0}
      y={0}
      fill={fill}
      stroke={stroke}
      strokeWidth={1}
      opacity={drawingTool === "marker" ? 0.58 : 1}
    />
  );
};

export default Path;
