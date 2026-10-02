"use client";
import { useErrorListener, useRoom, useStatus } from "@liveblocks/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { reportFailure } from "@/lib/monitoring";
export function RoomHealth() {
  const room = useRoom(), status = useStatus();
  const [failed, setFailed] = useState(false);
  useErrorListener(error => { setFailed(true); reportFailure("collaboration", error); toast.error("Collaboration is unavailable. Check your connection and organization access.", { id: "collaboration-error" }); });
  useEffect(() => {
    if (status === "connected") { setFailed(false); return; }
    const timer = setTimeout(() => setFailed(true), 30000);
    return () => clearTimeout(timer);
  }, [status]);
  if (!failed) return null;
  return <section role="alert" className="fixed left-1/2 top-24 z-50 w-[min(90vw,440px)] -translate-x-1/2 rounded-xl border bg-background p-5 text-foreground shadow-xl"><h2 className="font-semibold">Collaboration could not connect</h2><p className="my-3 text-sm text-muted-foreground">Check your network and team access. Keep this tab open while pending changes reconnect.</p><button className="rounded-lg border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setFailed(false); room.reconnect(); }}>Reconnect</button></section>;
}
