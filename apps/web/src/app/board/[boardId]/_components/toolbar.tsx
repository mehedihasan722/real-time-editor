"use client";

import React, { useEffect, useRef, useState } from "react";
import ToolButton from "./tool-button";
import {
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
} from "lucide-react";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";
import { FormatMenu } from "./format-menu";
import { DiagramPanel } from "./diagram-panel";
import { DiagramShapeKind } from "@/types/canvas";

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
}

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
}: ToolbarProps) => {
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formatsOpen && !diagramOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest?.(".shape-manager")) return;
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setFormatsOpen(false);
        setDiagramOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setFormatsOpen(false); setDiagramOpen(false); }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [formatsOpen, diagramOpen]);

  const insertTemplate = (template: string) => {
    onInsertTemplate(template);
    setFormatsOpen(false);
  };

  const openDiagram = () => {
    setFormatsOpen(false);
    setDiagramOpen(true);
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
          onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
          isActive={canvasState.mode === CanvasMode.Pencil}
        />
        <ToolButton label="Diagram & shapes" icon={Workflow} onClick={() => { setFormatsOpen(false); setDiagramOpen((open) => !open); }} isActive={diagramOpen} />
        <div className="my-1 h-px w-7 bg-slate-200" />
        <ToolButton
          label="Formats & flows"
          icon={Plus}
          onClick={() => { setDiagramOpen(false); setFormatsOpen((open) => !open); }}
          isActive={formatsOpen}
        />
        {formatsOpen && <FormatMenu onSelect={insertTemplate} onOpenDiagram={openDiagram} />}
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
