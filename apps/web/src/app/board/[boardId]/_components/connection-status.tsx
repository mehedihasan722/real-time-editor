"use client";
import { useStatus, useSyncStatus } from "@liveblocks/react";
import { useEffect, useRef } from "react";
import { recordDuration } from "@/lib/monitoring";
export function ConnectionStatus() {
  const connection = useStatus(), storage = useSyncStatus({ smooth: true });
  const started = useRef<number | null>(null);
  useEffect(() => {
    if (storage === "synchronizing" && started.current === null) started.current = performance.now();
    else if (storage === "synchronized" && started.current !== null) { recordDuration("collaboration.sync", performance.now() - started.current); started.current = null; }
  }, [storage]);
  useEffect(() => {
    if (storage === "synchronized") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [storage]);
  if (connection === "connected" && storage === "synchronized") return null;
  return <p role="status" className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border bg-background/95 px-4 py-2 text-xs text-foreground shadow-lg backdrop-blur">{connection === "connected" ? "Saving changes…" : "Reconnecting… Keep this board open to preserve pending changes."}</p>;
}
