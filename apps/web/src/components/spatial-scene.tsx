"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const Preview = dynamic(() => import("@/app/(dashboard)/_components/three-template-preview"), { ssr: false });

export function SpatialScene({ model = "cloud", compact = false, alt }: { model?: "cloud" | "workflow" | "workspace" | "ideas" | "carousel-roadmap" | "carousel-tasks" | "carousel-ideas"; compact?: boolean; alt?: string }) {
  const [paused, setPaused] = useState(false);
  const [entered, setEntered] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setEntered(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={host} className={`spatial-scene home-carousel__art${compact ? " spatial-scene--compact" : ""}`} data-scene-paused={String(paused)}>
    <Image unoptimized src={`/models/${model}.png`} alt={alt ?? (model === "cloud" ? "An illuminated Flowboard cloud connecting a laptop and idea globe on a floating platform" : "A miniature collaborative Flowboard workspace")} width={1000} height={800} className="spatial-scene__poster" />
    <div className="spatial-scene__canvas">{entered && <Preview model={model} />}</div>
    <button type="button" className="spatial-scene__pause" aria-label={paused ? "Play 3D animation" : "Pause 3D animation"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}</button>
  </div>;
}
