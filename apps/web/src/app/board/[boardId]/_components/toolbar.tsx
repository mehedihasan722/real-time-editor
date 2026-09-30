"use client";

import React, { useEffect, useRef, useState } from "react";
import ToolButton from "./tool-button";
import {
  Eraser,
  Highlighter,
  Frame,
  Circle,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Sparkles,
  Square,
  StickyNote,
  Type,
  Undo2,
  Workflow,
  WandSparkles,
  Shapes,
  Sticker,
} from "lucide-react";
import { CanvasMode, CanvasState, Color, DrawingTool, LayerType } from "@/types/canvas";
import { colorToCss } from "@/lib/utils";
import { FormatMenu } from "./format-menu";
import { DiagramPanel } from "./diagram-panel";
import { DiagramShapeKind } from "@/types/canvas";
import { ShapeMenu } from "./shape-menu";
import { FrameMenu } from "./frame-menu";
import { StickerPanel } from "./sticker-panel";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenStarter: () => void;
  onInsertTemplate: (template: string) => void;
  onInsertShape: (kind: DiagramShapeKind) => void;
  drawingColor: Color;
  onDrawingColorChange: (color: Color) => void;
  onInsertFrame: (width: number, height: number, label: string) => void;
  onInsertSticker: (value: string) => void;
}

const drawingColors: Color[] = [
  { r: 255, g: 224, b: 121, a: 1 }, { r: 255, g: 197, b: 48, a: 1 }, { r: 189, g: 132, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 },
  { r: 255, g: 180, b: 118, a: 1 }, { r: 255, g: 139, b: 62, a: 1 }, { r: 174, g: 75, b: 4, a: 1 }, { r: 230, g: 230, b: 230, a: 1 },
  { r: 255, g: 148, b: 148, a: 1 }, { r: 255, g: 80, b: 91, a: 1 }, { r: 194, g: 12, b: 22, a: 1 }, { r: 177, g: 177, b: 177, a: 1 },
  { r: 138, g: 236, b: 172, a: 1 }, { r: 38, g: 198, b: 91, a: 1 }, { r: 4, g: 129, b: 52, a: 1 }, { r: 88, g: 88, b: 88, a: 1 },
  { r: 151, g: 196, b: 255, a: 1 }, { r: 82, g: 145, b: 235, a: 1 }, { r: 47, g: 93, b: 181, a: 1 }, { r: 24, g: 24, b: 24, a: 1 },
  { r: 192, g: 179, b: 255, a: 1 }, { r: 135, g: 112, b: 230, a: 1 }, { r: 104, g: 58, b: 214, a: 1 },
];

const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  onOpenStarter,
  onInsertTemplate,
  onInsertShape,
  drawingColor,
  onDrawingColorChange,
  onInsertFrame,
  onInsertSticker,
}: ToolbarProps) => {
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [framesOpen, setFramesOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formatsOpen && !diagramOpen && !colorPaletteOpen && !shapesOpen && !framesOpen && !stickersOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest?.(".shape-manager")) return;
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setFormatsOpen(false);
        setDiagramOpen(false);
        setColorPaletteOpen(false);
        setShapesOpen(false);
        setFramesOpen(false);
        setStickersOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setFormatsOpen(false); setDiagramOpen(false); setColorPaletteOpen(false); setShapesOpen(false); setFramesOpen(false); setStickersOpen(false); }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [formatsOpen, diagramOpen, colorPaletteOpen, shapesOpen, framesOpen, stickersOpen]);

  const insertTemplate = (template: string) => {
    onInsertTemplate(template);
    setFormatsOpen(false);
  };

  const openDiagram = () => {
    setFormatsOpen(false);
    setShapesOpen(false);
    setFramesOpen(false);
    setStickersOpen(false);
    setDiagramOpen(true);
  };

  const insertQuickShape = (kind: DiagramShapeKind) => {
    onInsertShape(kind);
    setShapesOpen(false);
  };

  const selectDrawingTool = (tool: DrawingTool) => {
    const width = canvasState.mode === CanvasMode.Pencil ? canvasState.width : 8;
    setCanvasState({ mode: CanvasMode.Pencil, tool, width });
  };

  const setDrawingWidth = (width: number) => {
    const tool = canvasState.mode === CanvasMode.Pencil ? canvasState.tool : "pen";
    setCanvasState({ mode: CanvasMode.Pencil, tool, width });
  };

  const setCustomColor = (hex: string) => {
    const value = hex.replace("#", "");
    onDrawingColorChange({
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16),
      a: 1,
    });
  };

  return (
    <div ref={toolbarRef} className="absolute z-20 top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-3">
      <div className="board-toolbar flex gap-y-1 flex-col items-center">
        <ToolButton
          label="Flowboard Assist"
          icon={Sparkles}
          onClick={onOpenStarter}
        />
        <div className="my-1 h-px w-7 bg-slate-200" />
        <ToolButton
          label="select"
          icon={MousePointer2}
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing
          }
        />
        <ToolButton
          label="Text"
          icon={Type}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Text
          }
        />
        <ToolButton
          label="sticky note"
          icon={StickyNote}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Note,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Note
          }
        />
        <ToolButton
          label="Rectangle"
          icon={Square}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Rectangle,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Rectangle
          }
        />
        <ToolButton
          label="ellipse"
          icon={Circle}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Ellipse,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Ellipse
          }
        />
        <ToolButton
          label="pen"
          icon={Pencil}
          onClick={() => selectDrawingTool(canvasState.mode === CanvasMode.Pencil ? canvasState.tool : "pen")}
          isActive={canvasState.mode === CanvasMode.Pencil}
        />
        {canvasState.mode === CanvasMode.Pencil && (
          <div className="drawing-palette" aria-label="Drawing tools">
            {([
              ["pen", Pencil, "Pen"],
              ["marker", Highlighter, "Marker"],
              ["style", WandSparkles, "Smart drawing"],
              ["eraser", Eraser, "Object eraser"],
              ["pixel-eraser", Eraser, "Partial eraser"],
            ] as const).map(([tool, Icon, label]) => (
              <button key={tool} type="button" title={label} aria-label={label} className={canvasState.tool === tool ? "is-active" : ""} onClick={() => selectDrawingTool(tool)}>
                <Icon size={19} />
              </button>
            ))}
            <span className="drawing-palette__divider" />
            {[4, 8, 16].map((width) => (
              <button key={width} type="button" title={`${width}px stroke`} aria-label={`${width}px stroke`} className={`drawing-width ${canvasState.width === width ? "is-active" : ""}`} onClick={() => setDrawingWidth(width)}>
                <i style={{ width: Math.max(5, width), height: Math.max(5, width) }} />
              </button>
            ))}
            <span className="drawing-palette__divider" />
            <button type="button" className={`drawing-color-trigger ${colorPaletteOpen ? "is-active" : ""}`} title="Drawing colors" aria-label="Drawing colors" onClick={() => setColorPaletteOpen((open) => !open)}>
              <i style={{ background: colorToCss(drawingColor) }} />
            </button>
            {colorPaletteOpen && (
              <div className="drawing-colors" onPointerDown={(event) => event.stopPropagation()}>
                <input aria-label="Stroke width" type="range" min="2" max="24" step="1" value={canvasState.width} onChange={(event) => setDrawingWidth(Number(event.target.value))} />
                <p>Brand colors</p>
                <label className="drawing-colors__add">+ Add color<input type="color" aria-label="Add custom drawing color" onChange={(event) => setCustomColor(event.target.value)} /></label>
                <p>All colors</p>
                <div className="drawing-colors__grid">
                  {drawingColors.map((color) => {
                    const css = colorToCss(color);
                    const active = css === colorToCss(drawingColor);
                    return <button key={css} type="button" aria-label={`Use ${css}`} className={active ? "is-active" : ""} style={{ background: css }} onClick={() => onDrawingColorChange(color)}>{active ? "✓" : ""}</button>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <ToolButton label="Shapes & lines" icon={Shapes} onClick={() => { setFormatsOpen(false); setDiagramOpen(false); setFramesOpen(false); setShapesOpen((open) => !open); }} isActive={shapesOpen} />
        {shapesOpen && <ShapeMenu onSelect={insertQuickShape} onMoreShapes={openDiagram} />}
        <ToolButton label="Frames" icon={Frame} onClick={() => { setFormatsOpen(false); setDiagramOpen(false); setShapesOpen(false); setFramesOpen((open) => !open); }} isActive={framesOpen} />
        {framesOpen && <FrameMenu onSelect={(width, height, label) => { onInsertFrame(width, height, label); setFramesOpen(false); }} onTemplate={(template) => { insertTemplate(template); setFramesOpen(false); }} onDiagram={openDiagram} />}
        <ToolButton label="Stickers" icon={Sticker} onClick={() => { setFormatsOpen(false); setDiagramOpen(false); setShapesOpen(false); setFramesOpen(false); setStickersOpen((open) => !open); }} isActive={stickersOpen} />
        {stickersOpen && <StickerPanel onClose={() => setStickersOpen(false)} onInsert={onInsertSticker} />}
        <ToolButton label="Diagram library" icon={Workflow} onClick={() => { setFormatsOpen(false); setShapesOpen(false); setFramesOpen(false); setDiagramOpen((open) => !open); }} isActive={diagramOpen} />
        <div className="my-1 h-px w-7 bg-slate-200" />
        <ToolButton
          label="Formats & flows"
          icon={Plus}
          onClick={() => { setDiagramOpen(false); setFormatsOpen((open) => !open); }}
          isActive={formatsOpen}
        />
        {formatsOpen && <FormatMenu onSelect={insertTemplate} onAction={(action) => {
          setFormatsOpen(false);
          if (action === "diagram") openDiagram();
          if (action === "frames") setFramesOpen(true);
          if (action === "shapes") setShapesOpen(true);
          if (action === "stickers") setStickersOpen(true);
          if (action === "eraser") setCanvasState({ mode: CanvasMode.Pencil, tool: "eraser", width: 8 });
          if (action === "note") setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Note });
          if (action === "text") setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Text });
        }} />}
        {diagramOpen && <DiagramPanel onClose={() => setDiagramOpen(false)} onInsertShape={onInsertShape} onCreateDiagram={() => { insertTemplate("Diagram"); setDiagramOpen(false); }} />}
      </div>
      <div className="board-toolbar flex flex-col items-center">
        <ToolButton
          label="Undo"
          icon={Undo2}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label="Redo"
          icon={Redo2}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
    </div>
  );
};

export default Toolbar;
export const ToolbarSkeleton = () => {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-3">
      <div className="board-skeleton h-[430px] w-[52px] rounded-xl" />
      <div className="board-skeleton h-[92px] w-[52px] rounded-xl" />
    </div>
  );
};
