"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { LiveObject } from "@liveblocks/client";
import { ConvexError } from "convex/values";
import { useMutation as useConvexMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { MousePointer2, Hand, Square, Circle, StickyNote, Pencil, Type, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMyPresence, useOthers, useStorage, useMutation, useSelf, useStatus } from "./liveblocks.config";
import { bounds, hitLayer, processSketch, screenToCanvas, zoomAt } from "./geometry";
import { drawLayer, renderScene } from "./renderer";
import { VECTOR_LIMITS, isRenderableLayer, type VectorCamera, type VectorLayer, type VectorPoint, type VectorTool } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Entry = readonly [string, VectorLayer];
type Gesture = { pointer: number; origin: VectorPoint; current: VectorPoint; camera: VectorCamera } & (
  | { kind: "pan" }
  | { kind: "move"; originals: Map<string, VectorLayer> }
  | { kind: "draw"; tool: Exclude<VectorTool, "select" | "pan">; points: VectorPoint[] }
  | { kind: "marquee"; additive: string[] }
);
const tools = [
  { id: "select", name: "Select", key: "V", icon: MousePointer2 },
  { id: "pan", name: "Pan", key: "H", icon: Hand },
  { id: "rectangle", name: "Rectangle", key: "R", icon: Square },
  { id: "ellipse", name: "Ellipse", key: "O", icon: Circle },
  { id: "sticky", name: "Sticky note", key: "N", icon: StickyNote },
  { id: "text", name: "Text", key: "T", icon: Type },
  { id: "path", name: "Pencil", key: "P", icon: Pencil },
] as const;
const editableTarget = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input,textarea,select,[contenteditable='true'],button,a"));
function rgbaHex(value: string) { const values = value.match(/\d+/g); return values ? `#${values.slice(0, 3).map(v => Number(v).toString(16).padStart(2, "0")).join("")}` : "#6366f1"; }
function hexRgba(value: string) { return `rgba(${parseInt(value.slice(1, 3), 16)},${parseInt(value.slice(3, 5), 16)},${parseInt(value.slice(5, 7), 16)},1)`; }
function newLayer(geometry: Pick<VectorLayer, "type" | "x" | "y" | "width" | "height" | "points">, dark: boolean, order: number): VectorLayer {
  return { ...geometry, fill: geometry.type === "sticky" ? "rgba(253,230,138,1)" : geometry.type === "text" ? dark ? "rgba(165,180,252,1)" : "rgba(79,70,229,1)" : "rgba(99,102,241,0.18)", stroke: "rgba(99,102,241,1)", strokeWidth: 2, order, version: 0, text: "" };
}

export default function CanvasWorkspace({ boardId }: { boardId: Id<"boards"> }) {
  const board = useQuery(api.board.get, { id: boardId });
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(api.vector.getBoardLayers, { boardId }, { initialNumItems: 200 });
  const commit = useConvexMutation(api.vector.commitLayers);
  const layers = useStorage(root => root.layers), others = useOthers(), self = useSelf(), status = useStatus();
  const [presence, updatePresence] = useMyPresence();
  const { resolvedTheme } = useTheme();
  const [tool, setTool] = useState<VectorTool>("select"), [zoom, setZoom] = useState(1), [saving, setSaving] = useState(false);
  const [recognize, setRecognize] = useState(false), [revision, setRevision] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null), hostRef = useRef<HTMLDivElement>(null);
  const camera = useRef<VectorCamera>({ panX: 120, panY: 120, zoom: 1 });
  const gesture = useRef<Gesture | null>(null), space = useRef(false), dirty = useRef(true), raf = useRef(0);
  const size = useRef({ width: 1, height: 1, dpr: 1 }), entries = useRef<readonly Entry[]>([]);
  const overlay = useRef(new Map<string, VectorLayer>()), pending = useRef(new Set<string>());
  const queuedCursor = useRef<VectorPoint | null | undefined>(undefined), lastPresence = useRef(-Infinity), lastMutation = useRef(-Infinity);
  const hydrated = useRef(false), busy = useRef(false), mounted = useRef(true);
  const selection = useRef(presence.selection), dark = useRef(resolvedTheme === "dark"), activeTool = useRef(tool), recognizeRef = useRef(recognize);
  const writable = Boolean(self?.canWrite && status === "connected" && layers && pageStatus === "Exhausted");
  const writableRef = useRef(writable);
  const othersRef = useRef(others);
  const peerDragging = useRef(new Set<string>());
  const peerDraggingKey = others.flatMap(user => user.presence.dragging ?? []).sort().join(",");
  useEffect(() => { peerDragging.current = new Set(peerDraggingKey ? peerDraggingKey.split(",") : []); }, [peerDraggingKey]);
  useEffect(() => { othersRef.current = others; dirty.current = true; }, [others]);
  useEffect(() => { writableRef.current = writable; }, [writable]);
  useEffect(() => { activeTool.current = tool; }, [tool]);
  useEffect(() => { recognizeRef.current = recognize; }, [recognize]);
  useEffect(() => { selection.current = presence.selection; dirty.current = true; }, [presence.selection]);
  useEffect(() => { dark.current = resolvedTheme === "dark"; dirty.current = true; }, [resolvedTheme]);
  useEffect(() => { if (pageStatus === "CanLoadMore") loadMore(200); }, [pageStatus, loadMore]);
  const sorted = useMemo(() => {
    const values: Entry[] = self?.canWrite ? layers ? Object.entries(layers).map(([id, layer]) => [id, layer as VectorLayer] as const) : [] : results.filter(layer => !layer.deleted).map(layer => {
      const live = layers?.[layer.layerId];
      return [layer.layerId, live && live.version >= layer.version ? live as VectorLayer : layer] as const;
    });
    return values.filter(([, layer]) => isRenderableLayer(layer)).sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0]));
  }, [layers, results, self?.canWrite]);
  useEffect(() => { entries.current = sorted; dirty.current = true; }, [sorted]);

  const write = useMutation(({ storage }, updates: readonly Entry[], deletes: readonly { id: string; maxVersion: number }[] = []) => {
    const map = storage.get("layers");
    for (const { id, maxVersion } of deletes) if ((map.get(id)?.get("version") ?? 0) <= maxVersion) map.delete(id);
    for (const [id, value] of updates) {
      const object = map.get(id);
      if (object) { if (object.get("version") <= value.version) object.update(value); }
      else map.set(id, new LiveObject(value));
    }
  }, []);
  const move = useMutation(({ storage }, updates: readonly Entry[]) => {
    for (const [id, value] of updates) {
      const object = storage.get("layers").get(id);
      if (object && object.get("version") === value.version) object.update({ x: value.x, y: value.y });
    }
  }, []);
  const reconcile = useMutation(({ storage }, snapshot: typeof results, reset: boolean) => {
    const map = storage.get("layers");
    const known = new Set(snapshot.map(layer => layer.layerId));
    if (reset) for (const id of map.keys()) if (!known.has(id) && !pending.current.has(id) && !peerDragging.current.has(id)) map.delete(id);
    for (const layer of snapshot) {
      if (pending.current.has(layer.layerId) || peerDragging.current.has(layer.layerId)) continue;
      const previous = map.get(layer.layerId);
      if (previous && previous.get("version") > layer.version) continue;
      if (layer.deleted) { map.delete(layer.layerId); continue; }
      const { type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points } = layer;
      const value: VectorLayer = { type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points };
      if (!previous) map.set(layer.layerId, new LiveObject(value));
      else previous.reconcile(value);
    }
  }, []);
  const storageReady = Boolean(layers);
  const durableVersions = useMemo(() => Object.entries(layers ?? {}).map(([id, layer]) => `${id}:${layer?.version}`).join("|"), [layers]);
  useEffect(() => {
    if (pageStatus !== "Exhausted" || !storageReady || !self?.canWrite) return;
    reconcile(results, !hydrated.current); hydrated.current = true;
  }, [results, pageStatus, storageReady, self?.canWrite, reconcile, revision, peerDraggingKey, durableVersions]);
  useEffect(() => {
    if (pageStatus !== "Exhausted" || !storageReady || !self?.canWrite) return;
    const timer = window.setTimeout(() => reconcile(results, true), 5000);
    return () => window.clearTimeout(timer);
  }, [results, pageStatus, storageReady, self?.canWrite, reconcile, peerDraggingKey, durableVersions]);

  const save = useCallback(async (updates: readonly Entry[], deletes: readonly Entry[] = [], movementOnly = false) => {
    if (busy.current || !writableRef.current || updates.length + deletes.length === 0) return;
    busy.current = true; setSaving(true);
    const ids = [...updates, ...deletes].map(([id]) => id);
    ids.forEach(id => pending.current.add(id));
    updatePresence({ dragging: ids });
    if (movementOnly) move(updates);
    else write(updates, deletes.map(([id, layer]) => ({ id, maxVersion: layer.version })));
    try {
      const changes = [...updates.map(([layerId, layer]) => { const { version, ...value } = layer; return movementOnly ? { layerId, expectedVersion: version, position: { x: layer.x, y: layer.y } } : { layerId, expectedVersion: version, layer: value }; }),
        ...deletes.map(([layerId, layer]) => ({ layerId, expectedVersion: layer.version, layer: null }))];
      const accepted = await commit({ boardId, changes });
      const versions = new Map(accepted.map(value => [value.layerId, value.version]));
      if (mounted.current) write(updates.map(([id, layer]) => [id, { ...layer, version: versions.get(id)! }] as const));
    } catch (cause) {
      const byId = new Map(results.map(layer => [layer.layerId, layer]));
      const restore: Entry[] = [], remove: { id: string; maxVersion: number }[] = [];
      for (const id of ids) {
        const original = byId.get(id);
        if (!original || original.deleted) remove.push({ id, maxVersion: [...updates, ...deletes].find(([key]) => key === id)?.[1].version ?? 0 });
        else { const { type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points } = original; restore.push([id, { type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points }]); }
      }
      if (mounted.current) {
        write(restore, remove);
        toast.error(cause instanceof ConvexError && typeof cause.data === "string" ? cause.data : "Could not confirm this edit. The last received saved state was restored; reconnect or retry if another session changed it.");
      }
    } finally {
      ids.forEach(id => pending.current.delete(id)); overlay.current.clear(); busy.current = false; dirty.current = true;
      if (mounted.current) { updatePresence({ dragging: [] }); setSaving(false); setRevision(value => value + 1); }
    }
  }, [boardId, commit, results, write, move, updatePresence]);

  const cancelGesture = useCallback(() => {
    const current = gesture.current;
    if (current?.kind === "move" && self?.canWrite) {
      const restored = [...current.originals].filter(([id, layer]) => entries.current.find(([key]) => key === id)?.[1].version === layer.version);
      move(restored); current.originals.forEach((_, id) => pending.current.delete(id));
    }
    gesture.current = null; overlay.current.clear(); dirty.current = true;
    if (!busy.current) updatePresence({ dragging: [] });
  }, [self?.canWrite, move, updatePresence]);
  useEffect(() => { if (status !== "connected") cancelGesture(); }, [status, cancelGesture]);
  const deleteSelected = useCallback(() => {
    if (!writableRef.current || busy.current) return;
    const selected = entries.current.filter(([id]) => selection.current.includes(id));
    if (selected.length > 100) { toast.error("Select at most 100 layers for one edit."); return; }
    void save([], selected); updatePresence({ selection: [] });
  }, [save, updatePresence]);
  const deleteRef = useRef(deleteSelected);
  useEffect(() => { deleteRef.current = deleteSelected; }, [deleteSelected]);
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  useEffect(() => {
    const canvas = canvasRef.current, host = hostRef.current;
    const overlayMap = overlay.current, pendingSet = pending.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { toast.error("Your browser cannot initialize a 2D canvas."); return; }
    mounted.current = true;
    const resize = () => {
      const rect = host.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(16_000_000 / Math.max(1, rect.width * rect.height)));
      size.current = { width: rect.width, height: rect.height, dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr)); dirty.current = true;
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      if (gesture.current) return;
      const rect = canvas.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.current.height : 1);
      camera.current = zoomAt(camera.current, { x: event.clientX - rect.left, y: event.clientY - rect.top }, delta);
      queuedCursor.current = screenToCanvas({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera.current);
      dirty.current = true; setZoom(camera.current.zoom);
    };
    const down = (event: KeyboardEvent) => {
      if (editableTarget(event.target) || !host.contains(document.activeElement)) return;
      if (event.code === "Space") { event.preventDefault(); space.current = true; }
      if (event.key === "Escape") { cancelGesture(); updatePresence({ selection: [] }); }
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); deleteRef.current(); }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && selection.current.length && writableRef.current && !busy.current) {
        event.preventDefault();
        const amount = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowRight" ? amount : event.key === "ArrowLeft" ? -amount : 0;
        const dy = event.key === "ArrowDown" ? amount : event.key === "ArrowUp" ? -amount : 0;
        const updates = entries.current.filter(([id]) => selection.current.includes(id)).slice(0, 100).map(([id, layer]) => [id, { ...layer, x: Math.max(-VECTOR_LIMITS.coordinate, Math.min(VECTOR_LIMITS.coordinate, layer.x + dx)), y: Math.max(-VECTOR_LIMITS.coordinate, Math.min(VECTOR_LIMITS.coordinate, layer.y + dy)) }] as const);
        void saveRef.current(updates, [], true);
      }
      if (event.key === "Enter" && writableRef.current && !busy.current && !gesture.current && activeTool.current !== "select" && activeTool.current !== "pan" && activeTool.current !== "path") {
        event.preventDefault();
        const tool = activeTool.current, origin = screenToCanvas({ x: size.current.width / 2, y: size.current.height / 2 }, camera.current);
        const id = crypto.randomUUID();
        const layer = newLayer({ type: tool, ...origin, width: tool === "sticky" ? 220 : 180, height: tool === "text" ? 100 : 160, points: [] }, dark.current, Math.max(0, ...entries.current.map(([, item]) => item.order)) + 1);
        void saveRef.current([[id, layer]]); updatePresence({ selection: [id] }); setTool("select");
      }
      if ((event.key === "PageDown" || event.key === "PageUp") && entries.current.length) {
        event.preventDefault();
        const index = entries.current.findIndex(([id]) => id === selection.current[0]);
        const next = (index + (event.key === "PageDown" ? 1 : -1) + entries.current.length) % entries.current.length;
        updatePresence({ selection: [entries.current[next][0]] });
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey) { const next = tools.find(item => item.key.toLowerCase() === event.key.toLowerCase()); if (next) setTool(next.id); }
    };
    const up = (event: KeyboardEvent) => { if (event.code === "Space") space.current = false; };
    const blur = () => { space.current = false; cancelGesture(); queuedCursor.current = null; };
    const unload = (event: BeforeUnloadEvent) => { if (busy.current || gesture.current?.kind === "move") { event.preventDefault(); event.returnValue = ""; } };
    const frame = (now: number) => {
      if (queuedCursor.current !== undefined && now - lastPresence.current >= 30) {
        updatePresence({ cursor: queuedCursor.current }); queuedCursor.current = undefined; lastPresence.current = now;
      }
      if (overlay.current.size && !busy.current && writableRef.current && now - lastMutation.current >= 30) { move([...overlay.current]); lastMutation.current = now; }
      if (dirty.current) {
        const { width, height, dpr } = size.current;
        const visible = overlay.current.size ? entries.current.map(([id, layer]) => [id, overlay.current.get(id) ?? layer] as const) : entries.current;
        renderScene(ctx, visible, camera.current, width, height, dpr, dark.current, selection.current);
        const visibleById = new Map(visible);
        for (const user of othersRef.current.slice(0, 50)) {
          ctx.strokeStyle = "#0ea5e9"; ctx.lineWidth = 2 / camera.current.zoom;
          for (const id of user.presence.selection.slice(0, 100)) {
            const layer = visibleById.get(id);
            if (layer) ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
          }
          const cursor = user.presence.cursor;
          if (cursor && Number.isFinite(cursor.x) && Number.isFinite(cursor.y)) {
            ctx.save(); ctx.translate(cursor.x, cursor.y); ctx.scale(1 / camera.current.zoom, 1 / camera.current.zoom);
            ctx.fillStyle = "#4f46e5"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.lineTo(5, 13); ctx.lineTo(13, 13); ctx.closePath(); ctx.fill();
            ctx.font = "12px system-ui, sans-serif"; ctx.fillText((user.info?.name || "Collaborator").slice(0, 40), 16, 20); ctx.restore();
          }
        }
        const current = gesture.current;
        if (current?.kind === "draw" || current?.kind === "marquee") {
          const box = bounds([current.origin, current.current]);
          if (current.kind === "marquee") { ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 1 / camera.current.zoom; ctx.strokeRect(box.x, box.y, box.width, box.height); }
          else {
            const pathBounds = current.tool === "path" ? bounds(current.points) : box;
            const sketch = current.tool === "path" ? { ...pathBounds, type: "path" as const, points: current.points.map(point => ({ x: point.x - pathBounds.x, y: point.y - pathBounds.y })) } : { ...box, type: current.tool, points: [] };
            drawLayer(ctx, { ...sketch, fill: current.tool === "sticky" ? "rgba(253,230,138,1)" : "rgba(99,102,241,0.18)", stroke: "rgba(99,102,241,1)", strokeWidth: 2, text: "", version: 0, order: 0 }, dark.current);
          }
        }
        dirty.current = false;
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    canvas.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); window.addEventListener("beforeunload", unload); window.addEventListener("resize", resize);
    return () => {
      mounted.current = false; cancelAnimationFrame(raf.current); observer.disconnect(); cancelGesture();
      canvas.removeEventListener("wheel", wheel); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); window.removeEventListener("beforeunload", unload);
      window.removeEventListener("resize", resize);
      queuedCursor.current = undefined; canvas.width = 1; canvas.height = 1;
      entries.current = []; overlayMap.clear(); pendingSet.clear();
    };
  }, [cancelGesture, updatePresence, move]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const pointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (gesture.current || event.button > 1) return;
    event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    const screen = point(event), world = screenToCanvas(screen, camera.current);
    const base = { pointer: event.pointerId, origin: world, current: world, camera: { ...camera.current } };
    if (space.current || event.button === 1 || activeTool.current === "pan") { gesture.current = { ...base, origin: screen, current: screen, kind: "pan" }; return; }
    if (busy.current) return;
    if (activeTool.current !== "select") {
      if (!writableRef.current) { toast.error("Connect with an editor role to draw."); return; }
      gesture.current = { ...base, kind: "draw", tool: activeTool.current, points: [world] }; return;
    }
    const hit = [...entries.current].reverse().find(([, layer]) => hitLayer(layer, world, camera.current.zoom));
    if (!hit) { gesture.current = { ...base, kind: "marquee", additive: event.shiftKey ? [...selection.current] : [] }; if (!event.shiftKey) updatePresence({ selection: [] }); return; }
    const ids = event.shiftKey ? (selection.current.includes(hit[0]) ? selection.current.filter(id => id !== hit[0]) : [...selection.current, hit[0]]) : selection.current.includes(hit[0]) ? selection.current : [hit[0]];
    updatePresence({ selection: ids }); selection.current = ids;
    if (writableRef.current && ids.length <= 100 && ids.includes(hit[0])) {
      const originals = new Map(entries.current.filter(([id]) => ids.includes(id)).map(([id, layer]) => [id, { ...layer }]));
      originals.forEach((_, id) => pending.current.add(id)); gesture.current = { ...base, kind: "move", originals };
      updatePresence({ dragging: [...originals.keys()] });
    }
  };
  const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const screen = point(event), world = screenToCanvas(screen, camera.current); queuedCursor.current = world;
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    if (current.kind === "pan") {
      current.current = screen; camera.current.panX = current.camera.panX + screen.x - current.origin.x; camera.current.panY = current.camera.panY + screen.y - current.origin.y;
      queuedCursor.current = screenToCanvas(screen, camera.current);
    } else {
      current.current = world;
      if (current.kind === "move") for (const [id, layer] of current.originals) overlay.current.set(id, { ...layer, x: Math.max(-VECTOR_LIMITS.coordinate, Math.min(VECTOR_LIMITS.coordinate, layer.x + world.x - current.origin.x)), y: Math.max(-VECTOR_LIMITS.coordinate, Math.min(VECTOR_LIMITS.coordinate, layer.y + world.y - current.origin.y)) });
      if (current.kind === "draw" && current.tool === "path") {
        const previous = current.points.at(-1)!;
        if ((world.x - previous.x) ** 2 + (world.y - previous.y) ** 2 > (1 / camera.current.zoom) ** 2) current.points.push(world);
        if (current.points.length > VECTOR_LIMITS.points) current.points = current.points.filter((_, index) => index === 0 || index === current.points.length - 1 || index % 2 === 0);
      }
    }
    dirty.current = true;
  };
  const pointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    pointerMove(event); gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.kind === "move") {
      const updates = [...current.originals].map(([id, layer]) => [id, overlay.current.get(id) ?? layer] as const);
      current.originals.forEach((_, id) => pending.current.delete(id));
      if (updates.some(([id, layer]) => layer.x !== current.originals.get(id)!.x || layer.y !== current.originals.get(id)!.y)) void save(updates, [], true);
      else { overlay.current.clear(); dirty.current = true; updatePresence({ dragging: [] }); }
    }
    if (current.kind === "draw") {
      if (current.tool === "path" && current.points.length < 2) { dirty.current = true; return; }
      let geometry = current.tool === "path" ? processSketch(current.points, 2 / camera.current.zoom, recognizeRef.current) : { ...bounds([current.origin, current.current]), type: current.tool, points: [] };
      if (geometry.width < 2 && geometry.height < 2 && current.tool !== "path") geometry = { ...geometry, width: current.tool === "sticky" ? 220 : 180, height: current.tool === "text" ? 100 : 160 };
      const layer = newLayer(geometry, dark.current, Math.max(0, ...entries.current.map(([, item]) => item.order)) + 1);
      const id = crypto.randomUUID(); void save([[id, layer]]); updatePresence({ selection: [id] }); setTool("select");
    }
    if (current.kind === "marquee") {
      const box = bounds([current.origin, current.current]);
      const ids = entries.current.filter(([, layer]) => layer.x <= box.x + box.width && layer.x + layer.width >= box.x && layer.y <= box.y + box.height && layer.y + layer.height >= box.y).map(([id]) => id);
      updatePresence({ selection: [...new Set([...current.additive, ...ids])].slice(0, 100) });
    }
    dirty.current = true;
  };
  const selectedEntry = sorted.find(([id]) => presence.selection.includes(id));
  const selected = selectedEntry?.[1];
  const changeSelected = (patch: Partial<VectorLayer>) => { if (selectedEntry && writable && !busy.current) void save([[selectedEntry[0], { ...selectedEntry[1], ...patch }]]); };
  const glass = "border border-slate-300 bg-white/90 text-slate-900 shadow-lg backdrop-blur-md dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100";
  return <div ref={hostRef} className="spatial-engine relative h-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
    <canvas ref={canvasRef} tabIndex={0} aria-label="Collaborative infinite canvas. Use V to select, R for rectangle, O for ellipse, N for sticky note, T for text, P for pencil. Page Up and Page Down select layers. Hold Space and drag to pan. Use the mouse wheel to zoom." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancelGesture} onLostPointerCapture={cancelGesture} onPointerLeave={() => { if (!gesture.current) queuedCursor.current = null; }} className="h-full w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500" style={{ cursor: tool === "select" ? "default" : "crosshair" }} />
    <p aria-live="polite" className="sr-only">{selected ? `Selected ${selected.type}: ${selected.text || "Untitled layer"}` : "No layer selected"}</p>
    <header className={`absolute left-4 right-4 top-4 flex items-center justify-between gap-3 rounded-2xl px-3 py-2 ${glass}`}>
      <div className="flex min-w-0 items-center gap-3"><Link href={`/board/${boardId}`} aria-label="Back to board" className="rounded-lg p-2 focus-visible:outline focus-visible:outline-2"><ArrowLeft size={18} /></Link><div className="truncate"><h1 className="truncate text-sm font-semibold">{board?.title || "Flowboard"}</h1><p role="status" className="text-xs text-slate-600 dark:text-slate-300">{saving ? "Saving…" : status === "connected" ? "Canvas 2D · Connected" : "Reconnecting · Drawing paused"}</p></div></div>
      <div className="flex items-center gap-2" aria-label={`${others.length + 1} collaborators`}>
        {others.slice(0, 5).map(user => <Avatar key={user.connectionId} title={user.info?.name || "Collaborator"} className="h-8 w-8 ring-2 ring-white dark:ring-slate-900"><AvatarImage src={user.info?.picture} alt={user.info?.name || "Collaborator"} /><AvatarFallback className="bg-indigo-100 text-xs text-indigo-900">{user.info?.name?.slice(0, 2).toUpperCase() || "FB"}</AvatarFallback></Avatar>)}
        <span className="text-xs">{others.length + 1} online</span>
      </div>
    </header>
    <nav aria-label="Canvas drawing tools" className={`absolute left-4 top-24 flex flex-col gap-2 rounded-2xl p-2 ${glass}`}>
      {tools.map(item => <Button key={item.id} aria-label={`${item.name} (${item.key})`} title={`${item.name} (${item.key})`} aria-pressed={tool === item.id} variant={tool === item.id ? "default" : "ghost"} size="icon" disabled={item.id !== "select" && item.id !== "pan" && !writable} onClick={() => setTool(item.id)}><item.icon size={18} /></Button>)}
    </nav>
    {selected && <aside aria-label="Selected layer properties" className={`absolute right-4 top-24 max-h-[calc(100dvh-180px)] w-60 overflow-y-auto rounded-2xl p-4 ${glass}`}>
      <h2 className="mb-4 text-sm font-semibold">{presence.selection.length > 1 ? `${presence.selection.length} selected` : "Layer properties"}</h2>
      <fieldset disabled={!writable || saving} className="space-y-4">
        <label className="flex items-center justify-between text-sm">Fill<input type="color" aria-label="Layer fill" value={rgbaHex(selected.fill)} onChange={event => changeSelected({ fill: hexRgba(event.target.value) })} /></label>
        <label className="flex items-center justify-between text-sm">Stroke<input type="color" aria-label="Layer stroke" value={rgbaHex(selected.stroke)} onChange={event => changeSelected({ stroke: hexRgba(event.target.value) })} /></label>
        <label className="block text-sm">Stroke width<Input key={`${selectedEntry![0]}:${selected.version}:stroke`} aria-label="Stroke width" type="number" min={0} max={64} defaultValue={selected.strokeWidth} onBlur={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value) && value >= 0 && value <= 64 && value !== selected.strokeWidth) changeSelected({ strokeWidth: value }); }} /></label>
        {(selected.type === "text" || selected.type === "sticky") && <label className="block text-sm">Text<textarea key={`${selectedEntry![0]}:${selected.version}:text`} aria-label="Layer text" defaultValue={selected.text} maxLength={VECTOR_LIMITS.text} rows={5} onBlur={event => { if (event.target.value !== selected.text) changeSelected({ text: event.target.value }); }} className="mt-2 w-full rounded-lg border border-slate-400 bg-transparent p-2 focus-visible:outline-indigo-500" /></label>}
        <div className="grid grid-cols-2 gap-2">{(["width", "height"] as const).map(field => <label key={field} className="text-xs capitalize">{field}<Input key={`${selectedEntry![0]}:${selected.version}:${field}`} aria-label={`Layer ${field}`} type="number" disabled={selected.type === "path"} min={1} max={VECTOR_LIMITS.dimension} defaultValue={selected[field]} onBlur={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value) && value > 0 && value <= VECTOR_LIMITS.dimension && value !== selected[field]) changeSelected({ [field]: value }); }} /></label>)}</div>
        <Button variant="destructive" className="w-full" onClick={deleteSelected}><Trash2 size={16} />Delete selected</Button>
      </fieldset>
    </aside>}
    <footer className={`absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${glass}`}>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={recognize} onChange={event => setRecognize(event.target.checked)} />Recognize rectangles</label>
      <span className="hidden text-xs text-slate-600 sm:block dark:text-slate-300">Space + drag to pan · {sorted.length} layers</span>
      <div className="flex items-center gap-2"><Button size="icon" variant="ghost" aria-label="Zoom out" onClick={() => { camera.current = zoomAt(camera.current, { x: size.current.width / 2, y: size.current.height / 2 }, 100); dirty.current = true; setZoom(camera.current.zoom); }}><Minus size={16} /></Button><output className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</output><Button size="icon" variant="ghost" aria-label="Zoom in" onClick={() => { camera.current = zoomAt(camera.current, { x: size.current.width / 2, y: size.current.height / 2 }, -100); dirty.current = true; setZoom(camera.current.zoom); }}><Plus size={16} /></Button></div>
    </footer>
  </div>;
}
