"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { RoomProvider, useErrorListener, useRoom, useStatus, useStorage } from "./liveblocks.config";
import type { VectorLayer } from "./types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CanvasSkeleton() {
  return <div role="status" aria-label="Loading collaborative canvas" className="relative h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div className="absolute left-6 top-24 h-80 w-14 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" />
    <div className="absolute left-24 right-6 top-6 h-14 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" />
    <p className="absolute inset-0 flex items-center justify-center text-slate-700 dark:text-slate-200">Connecting your workspace…</p>
  </div>;
}
function ConnectionHealth() {
  const status = useStatus(), room = useRoom();
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    setDelayed(false);
    if (status === "connected") return;
    const timer = window.setTimeout(() => setDelayed(true), 30000);
    return () => window.clearTimeout(timer);
  }, [status]);
  useErrorListener(() => toast.error("The collaboration service could not connect. Your saved board is safe."));
  return status === "disconnected" || delayed ? <div role="alert" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-500 bg-background p-4 text-foreground shadow-xl">
    Connection unavailable. <Button variant="outline" onClick={() => room.reconnect()}>Retry connection</Button>
  </div> : null;
}
function SocketReady({ children }: { children: ReactNode }) {
  const storage = useStorage(root => root.layers);
  return storage ? children : <CanvasSkeleton />;
}
function ConnectedRoom({ boardId, layers, children }: { boardId: Id<"boards">; layers: Doc<"canvas_layers">[]; children: ReactNode }) {
  const [initialStorage] = useState(() => ({ layers: new LiveMap(layers.filter(layer => !layer.deleted).map(layer => {
    const { type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points } = layer;
    return [layer.layerId, new LiveObject<VectorLayer>({ type, x, y, width, height, fill, stroke, strokeWidth, order, version, text, points })] as const;
  })) }));
  return <RoomProvider id={`vector:${boardId}`} initialPresence={{ cursor: null, selection: [], dragging: [] }} initialStorage={initialStorage}>
    <ConnectionHealth />
    <ClientSideSuspense fallback={<CanvasSkeleton />}><SocketReady>{children}</SocketReady></ClientSideSuspense>
  </RoomProvider>;
}
export default function Room({ boardId, children }: { boardId: Id<"boards">; children: ReactNode }) {
  const { results, status, loadMore } = usePaginatedQuery(api.vector.getBoardLayers, { boardId }, { initialNumItems: 200 });
  const [ready, setReady] = useState(false);
  useEffect(() => { if (status === "CanLoadMore") loadMore(200); }, [status, loadMore]);
  useEffect(() => { if (status === "Exhausted") setReady(true); }, [status]);
  if (!ready) return <CanvasSkeleton />;
  return <ConnectedRoom key={boardId} boardId={boardId} layers={results}>{children}</ConnectedRoom>;
}
