export type Color = { r: number; g: number; b: number; a: number };
export type DrawingTool = "pen" | "marker" | "style" | "eraser";

export type Camera = { x: number; y: number };

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Note,
  Shape,
  Sticker,
}

export type DiagramShapeKind =
  | "line"
  | "arrow"
  | "elbow-arrow"
  | "block-arrow"
  | "divider"
  | "rectangle"
  | "rounded"
  | "circle"
  | "triangle"
  | "diamond"
  | "star"
  | "arrow-right"
  | "arrow-left"
  | "hexagon"
  | "database"
  | "cloud"
  | "plus"
  | "document"
  | "parallelogram"
  | "terminator"
  | "actor"
  | "server"
  | "callout";

export type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | NoteLayer
  | ShapeLayer
  | StickerLayer;

export type StickerLayer = {
  type: LayerType.Sticker;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string;
};

export type ShapeLayer = {
  type: LayerType.Shape;
  shape: DiagramShapeKind;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type RectangleLayer = {
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type EllipseLayer = {
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type PathLayer = {
  type: LayerType.Path;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  points: number[][];
  strokeWidth?: number;
  drawingTool?: Exclude<DrawingTool, "eraser">;
  value?: string;
};

export type TextLayer = {
  type: LayerType.Text;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
};

export type NoteLayer = {
  type: LayerType.Note;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value?: string;
  author?: string;
  fontFamily?: "sans" | "hand";
  fontSize?: "small" | "medium" | "large";
  bold?: boolean;
  strike?: boolean;
  list?: boolean;
  link?: string;
};

export type Point = { x: number; y: number };

export type XYWH = { x: number; y: number; width: number; height: number };

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | { mode: CanvasMode.None }
  | { mode: CanvasMode.Pressing; origin: Point }
  | { mode: CanvasMode.SelectionNet; origin: Point; current?: Point }
  | { mode: CanvasMode.Translating; current: Point }
  | {
      mode: CanvasMode.Inserting;
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note;
    }
  | { mode: CanvasMode.Resizing; initialBounds: XYWH; corner: Side }
  | { mode: CanvasMode.Pencil; tool: DrawingTool; width: number };

export enum CanvasMode {
  None,
  Pressing,
  SelectionNet,
  Translating,
  Inserting,
  Resizing,
  Pencil,
}

export type Position = {
  top: string;
  left: string;
  right: string;
  bottom: string;
};
