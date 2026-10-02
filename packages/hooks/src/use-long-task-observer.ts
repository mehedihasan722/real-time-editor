"use client";
import { useEffect } from "react";
export function useLongTaskObserver(onDuration: (duration: number) => void) {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes.includes("longtask")) return;
    const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) onDuration(entry.duration); });
    observer.observe({ type: "longtask", buffered: false });
    return () => observer.disconnect();
  }, [onDuration]);
}
