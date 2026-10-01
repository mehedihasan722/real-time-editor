"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Info from "./info";
import Participants from "./participants";
import Toolbar from "./toolbar";
import { CommentSidebar } from "./comment-sidebar";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  Layer,
  LayerType,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";
import {
  useHistory,
  useCanRedo,
  useCanUndo,
  useMutation,
  useStorage,
  useOthersMapped,
} from "@liveblocks/react/suspense";
import CursorsPresence from "./cursors-presence";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
  isPointNearPath,
  erasePathPortion,
} from "@/lib/utils";
import { nanoid } from "nanoid";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import SelectionBox from "./selection-box";
import LayerPreview from "./layer-preview";
import { useSelf } from "@liveblocks/react";
import useDeleteLayers from "@/hooks/use-delete-layers";
import SelectionTools from "./selection-tools";
import Path from "./path";
import useDisableScrollBounce from "@/hooks/use-disable-scroll-bounce";
import { BoardStarter } from "./board-starter";
import { BoardControls } from "./board-controls";
import { getTemplateLayers } from "@/lib/board-templates";
import { createDiagramShapeLayer } from "@/lib/diagram-shapes";
import { recognizeDrawing } from "@/lib/smart-drawing";
import { DiagramShapeKind } from "@/types/canvas";
import { BoardFiles } from "./board-files";
import { MAX_LAYERS } from "@/lib/board-portability";
import { toast } from "sonner";

interface CanvasProps {
  boardId: string;
}
const Canvas = ({ boardId }: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);

  const info = useSelf((me) => me.info);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [placingComment, setPlacingComment] = useState(false);
  const [commentPoint, setCommentPoint] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [starterOpen, setStarterOpen] = useState(() => layerIds.length === 0);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
    a: 1,
  });

  useDisableScrollBounce();
  
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const importLayers = useMutation(({ storage, setMyPresence }, layers: Layer[]) => {
    const liveLayers = storage.get("layers");
    if (liveLayers.size + layers.length > MAX_LAYERS) {
      toast.error(`This board supports ${MAX_LAYERS} objects. Delete some objects or import into a new board.`);
      return;
    }
    const ids: string[] = [];
    const boundsX = Math.min(...layers.map(layer => layer.x));
    const boundsY = Math.min(...layers.map(layer => layer.y));
    const x = (window.innerWidth / 2 - camera.x) / zoom;
    const y = (window.innerHeight / 2 - camera.y) / zoom;
    for (const layer of layers) {
      const id = nanoid();
      liveLayers.set(id, new LiveObject<Layer>({ ...layer, x: layer.x - boundsX + x, y: layer.y - boundsY + y }));
      storage.get("layerIds").push(id); ids.push(id);
    }
    setMyPresence({ selection: ids }, { addToHistory: true });
    setStarterOpen(false);
    toast.success(`${ids.length} objects added`);
  }, [camera, zoom]);

  const applyStarter = useMutation(
    ({ storage, setMyPresence }, template: string, prompt?: string) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      const templateLayers = getTemplateLayers(template, prompt, info?.name || "Flowboard Assist");
      if (liveLayers.size + templateLayers.length > MAX_LAYERS) {
        toast.error(`This template would exceed the ${MAX_LAYERS}-object limit. Delete some objects first.`);
        return;
      }
      const centerX = (window.innerWidth / 2 - camera.x) / zoom;
      const centerY = (window.innerHeight / 2 - camera.y) / zoom;
      const offsetX = centerX - 570;
      const offsetY = centerY - 300;
      const insertedIds: string[] = [];

      templateLayers.forEach(([, layer]) => {
        if (liveLayers.size >= MAX_LAYERS) { toast.error(`Board limit reached (${MAX_LAYERS} objects). Delete objects to add more.`); return; }
        const id = nanoid();
        liveLayers.set(
          id,
          new LiveObject({ ...layer, x: layer.x + offsetX, y: layer.y + offsetY })
        );
        liveLayerIds.push(id);
        insertedIds.push(id);
      });

      setMyPresence({ selection: insertedIds });
      setStarterOpen(false);
    },
    [camera, info?.name, zoom]
  );

  const insertLayer = useMutation(
    (
      { storage, setMyPresence },
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note,
      position: Point
    ) => {
      const liveLayers = storage.get("layers");

      if (liveLayers.size >= MAX_LAYERS) { toast.error(`Board limit reached (${MAX_LAYERS} objects). Delete objects to add more.`); return; }

      const liveLayerIds = storage.get("layerIds");

      const layerId = nanoid();

      const layer: Layer = layerType === LayerType.Note
        ? { type: LayerType.Note, x: position.x, y: position.y, height: 180, width: 180, fill: lastUsedColor, author: info?.name || "Workspace member" }
        : { type: layerType, x: position.x, y: position.y, height: 100, width: 100, fill: lastUsedColor };

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, new LiveObject<Layer>(layer));

      setMyPresence({ selection: [layerId] }, { addToHistory: true });

      setCanvasState({ mode: CanvasMode.None });
    },
    [info?.name, lastUsedColor]
  );

  const insertDiagramShape = useMutation(
    ({ storage, setMyPresence }, kind: DiagramShapeKind) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) { toast.error(`Board limit reached (${MAX_LAYERS} objects). Delete objects to add more.`); return; }
      const id = nanoid();
      const position = {
        x: (window.innerWidth / 2 - camera.x) / zoom,
        y: (window.innerHeight / 2 - camera.y) / zoom,
      };
      liveLayers.set(id, new LiveObject(createDiagramShapeLayer(kind, position)));
      storage.get("layerIds").push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [camera, zoom]
  );

  const insertFrame = useMutation(
    ({ storage, setMyPresence }, width: number, height: number, label: string) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) { toast.error(`Board limit reached (${MAX_LAYERS} objects). Delete objects to add more.`); return; }
      const id = nanoid();
      const center = { x: (window.innerWidth / 2 - camera.x) / zoom, y: (window.innerHeight / 2 - camera.y) / zoom };
      const layer: Layer = { type: LayerType.Shape, shape: "rectangle", x: center.x - width / 2, y: center.y - height / 2, width, height, fill: { r: 255, g: 255, b: 255, a: 0.12 }, value: label };
      liveLayers.set(id, new LiveObject<Layer>(layer));
      storage.get("layerIds").push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [camera, zoom]
  );

  const insertSticker = useMutation(
    ({ storage, setMyPresence }, value: string) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) { toast.error(`Board limit reached (${MAX_LAYERS} objects). Delete objects to add more.`); return; }
      const id = nanoid();
      const center = { x: (window.innerWidth / 2 - camera.x) / zoom, y: (window.innerHeight / 2 - camera.y) / zoom };
      const layer: Layer = { type: LayerType.Sticker, x: center.x - 55, y: center.y - 55, width: 110, height: 110, fill: { r: 255, g: 255, b: 255, a: 0 }, value };
      liveLayers.set(id, new LiveObject<Layer>(layer));
      storage.get("layerIds").push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [camera, zoom]
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = new Map(Object.entries(storage.get("layers").toJSON()));
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });

      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        layers,
        origin,
        current
      );

      setMyPresence({ selection: ids });
    },
    [layerIds]
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 &&
          pencilDraft[0][0] === point.x &&
          pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]],
      });
    },
    [canvasState.mode]
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState]
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;

      if (
        pencilDraft == null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
      ) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      const recognized = canvasState.mode === CanvasMode.Pencil && canvasState.tool === "style"
        ? recognizeDrawing(pencilDraft, lastUsedColor, canvasState.width)
        : null;
      liveLayers.set(
        id,
        new LiveObject(
          recognized ?? penPointsToPathLayer(
            pencilDraft,
            lastUsedColor,
            canvasState.mode === CanvasMode.Pencil ? canvasState.width : 8,
            canvasState.mode === CanvasMode.Pencil &&
              (canvasState.tool === "pen" || canvasState.tool === "marker" || canvasState.tool === "style")
              ? canvasState.tool
              : "pen"
          )
        )
      );

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);

      setMyPresence({ pencilDraft: null });
      if (canvasState.mode !== CanvasMode.Pencil) {
        setCanvasState({ mode: CanvasMode.Pencil, tool: "pen", width: 8 });
      }
    },
    [canvasState, lastUsedColor]
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      if (canvasState.mode !== CanvasMode.Pencil || canvasState.tool.includes("eraser")) return;
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor,
        penWidth: canvasState.width,
        penTool: canvasState.tool,
      });
    },
    [canvasState, lastUsedColor]
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      );

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState]
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history]
  );

  const zoomTo = useCallback((nextZoom: number) => {
    const clampedZoom = Math.min(2, Math.max(0.25, nextZoom));
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setCamera((current) => ({
      x: center.x - ((center.x - current.x) * clampedZoom) / zoom,
      y: center.y - ((center.y - current.y) * clampedZoom) / zoom,
    }));
    setZoom(clampedZoom);
  }, [zoom]);

  const resetView = useCallback(() => {
    setCamera({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const nextZoom = Math.min(2, Math.max(0.25, zoom * Math.exp(-e.deltaY * 0.002)));
      const point = { x: e.clientX, y: e.clientY };
      setCamera((current) => ({
        x: point.x - ((point.x - current.x) * nextZoom) / zoom,
        y: point.y - ((point.y - current.y) * nextZoom) / zoom,
      }));
      setZoom(nextZoom);
      return;
    }
    setCamera((current) => ({
      x: current.x - e.deltaX,
      y: current.y - e.deltaY,
    }));
  }, [zoom]);

  const onPointerMove = useMutation(
    ({ setMyPresence, storage }, e: React.PointerEvent) => {
      e.preventDefault();

      if (panPointer.current?.id === e.pointerId) {
        const previous = panPointer.current;
        setCamera((current) => ({
          x: current.x + e.clientX - previous.x,
          y: current.y + e.clientY - previous.y,
        }));
        panPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        return;
      }

      const current = pointerEventToCanvasPoint(e, camera, zoom);

      if (
        canvasState.mode === CanvasMode.Pencil &&
        canvasState.tool.includes("eraser") &&
        (e.buttons & 1) === 1
      ) {
        const liveLayers = storage.get("layers");
        const liveLayerIds = storage.get("layerIds");
        const ids = liveLayerIds.toJSON();
        for (let index = ids.length - 1; index >= 0; index -= 1) {
          const layer = liveLayers.get(ids[index]);
          if (layer?.get("type") !== LayerType.Path) continue;
          const path = layer.toJSON() as Extract<Layer, { type: LayerType.Path }>;
          const radius = Math.max(10, canvasState.width);
          if (canvasState.tool === "eraser") {
            if (!isPointNearPath(path, current, radius)) continue;
            liveLayers.delete(ids[index]);
            liveLayerIds.delete(index);
            continue;
          }

          const segments = erasePathPortion(path, current, radius);
          if (!segments) continue;
          liveLayers.delete(ids[index]);
          liveLayerIds.delete(index);
          for (const segment of segments) {
            if (liveLayers.size >= MAX_LAYERS) break;
            const segmentId = nanoid();
            const absolutePoints = segment.map(([x, y, pressure]) => [x + path.x, y + path.y, pressure]);
            liveLayers.set(segmentId, new LiveObject<Layer>(penPointsToPathLayer(absolutePoints, path.fill, path.strokeWidth, path.drawingTool)));
            liveLayerIds.push(segmentId);
          }
        }
        setMyPresence({ cursor: current });
        return;
      }

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }
      setMyPresence({ cursor: current });
    },
    [
      canvasState,
      camera,
      zoom,
      translateSelectedLayers,
      resizeSelectedLayer,
      startMultiSelection,
      updateSelectionNet,
      continueDrawing,
    ]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        panPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsPanning(true);
        return;
      }

      const point = pointerEventToCanvasPoint(e, camera, zoom);

      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, zoom, canvasState.mode, setCanvasState, startDrawing]
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      if (panPointer.current?.id === e.pointerId) {
        panPointer.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsPanning(false);
        return;
      }

      const point = pointerEventToCanvasPoint(e, camera, zoom);
      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayers();
        setCanvasState({
          mode: CanvasMode.None,
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else {
        setCanvasState({
          mode: CanvasMode.None,
        });
      }
      history.resume();
    },
    [
      setCanvasState,
      camera,
      zoom,
      canvasState,
      history,
      insertLayer,
      unselectLayers,
      insertPath,
    ]
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation(
    ({ storage, self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (e.button === 1) return;

      if (canvasState.mode === CanvasMode.Pencil && canvasState.tool === "eraser") {
        e.stopPropagation();
        const liveLayers = storage.get("layers");
        if (liveLayers.has(layerId)) {
          const liveLayerIds = storage.get("layerIds");
          const index = liveLayerIds.toJSON().indexOf(layerId);
          if (index !== -1) liveLayerIds.delete(index);
          liveLayers.delete(layerId);
        }
        return;
      }
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera, zoom);

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, zoom, history, canvasState]
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;

      switch (e.key) {
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          deleteLayers();
          break;
        }
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
          }
          break;
        }
        case "y": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.undo();
            } else {
              history.redo();
            }
            break;
          }
          break;
        }
        case "+":
        case "=": {
          e.preventDefault();
          zoomTo(zoom + 0.1);
          break;
        }
        case "-": {
          e.preventDefault();
          zoomTo(zoom - 0.1);
          break;
        }
        case "0": {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetView();
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history, resetView, zoom, zoomTo]);

  return (
    <main className="h-full w-full relative board-canvas future-board touch-none" onPointerDownCapture={event => {
      if (!placingComment || event.button !== 0 || !(event.target as Element).closest("[data-board-surface]")) return;
      event.stopPropagation();
      event.preventDefault();
      setCommentPoint(pointerEventToCanvasPoint(event, camera, zoom));
      setPlacingComment(false);
      setCommentsOpen(true);
    }}>
      <Info boardId={boardId} />
      <Participants />
      <BoardFiles boardId={boardId} onImport={importLayers} />
      {layerIds.length >= MAX_LAYERS && <p role="status" className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded bg-amber-100 px-4 py-2 text-sm text-amber-950">Board limit reached ({MAX_LAYERS} objects). Delete objects to add more.</p>}
      <Toolbar
        commentsOpen={commentsOpen}
        onOpenComments={() => { setCommentsOpen(open => !open); setPlacingComment(false); }}
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
        onOpenStarter={() => setStarterOpen(true)}
        onInsertTemplate={applyStarter}
        onInsertShape={insertDiagramShape}
        drawingColor={lastUsedColor}
        onDrawingColorChange={setLastUsedColor}
        onInsertFrame={insertFrame}
        onInsertSticker={insertSticker}
      />
      <SelectionTools camera={camera} zoom={zoom} setLastUsedColor={setLastUsedColor} />
      <CommentSidebar open={commentsOpen} onClose={() => { setCommentsOpen(false); setPlacingComment(false); }} camera={camera} zoom={zoom} point={commentPoint} placing={placingComment} onPlace={() => { setCanvasState({ mode: CanvasMode.None }); setCommentPoint(null); setPlacingComment(true); }} onSubmitted={() => setCommentPoint(null)} onOpen={() => setCommentsOpen(true)} />
      {starterOpen && (
        <BoardStarter
          boardId={boardId}
          onGenerated={importLayers}
          name={info?.name}
          onClose={() => setStarterOpen(false)}
          onStart={applyStarter}
        />
      )}
      <BoardControls
        zoom={zoom}
        onZoomIn={() => zoomTo(zoom + 0.1)}
        onZoomOut={() => zoomTo(zoom - 0.1)}
        onReset={resetView}
      />
      <svg
        data-board-surface
        className={`h-[100vh] w-[100vw] ${isPanning ? "cursor-grabbing" : ""}`}
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={(event) => {
          if (panPointer.current?.id === event.pointerId) {
            panPointer.current = null;
            setIsPanning(false);
          }
        }}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <g data-export-content>{layerIds.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}</g>
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
              strokeWidth={canvasState.mode === CanvasMode.Pencil ? canvasState.width : 8}
              drawingTool={canvasState.mode === CanvasMode.Pencil && (canvasState.tool === "pen" || canvasState.tool === "marker" || canvasState.tool === "style") ? canvasState.tool : "pen"}
            />
          )}
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
