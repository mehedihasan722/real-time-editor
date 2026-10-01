"use client";
import { useCallback, useEffect, useRef } from "react";
export function useFrameCallback<T>(callback: (value: T) => void) {
  const latest = useRef(callback);
  useEffect(() => { latest.current = callback; }, [callback]);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ value: T } | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return useCallback((value: T) => {
    pending.current = { value };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => { frame.current = null; const value = pending.current; pending.current = null; if (value) latest.current(value.value); });
  }, []);
}
