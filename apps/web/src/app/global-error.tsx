"use client";
import { useEffect } from "react";
import { reportFailure } from "@/lib/monitoring";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { reportFailure("route", error); }, [error]);
  return <html lang="en"><body style={{ margin: 0, fontFamily: "system-ui", background: "#111827", color: "#f9fafb" }}><main style={{ maxWidth: 480, margin: "20vh auto", padding: 24 }}><h1>Flowboard could not load</h1><p>Check your connection and try again. Keep any other open board tabs open until their changes finish saving.</p><button onClick={reset} style={{ padding: "12px 20px", cursor: "pointer" }}>Try again</button></main></body></html>;
}
