"use client";
import { useEffect, useRef, useState } from "react";
import { ArcadeWorld } from "@/lib/arcade-world";
import { Game } from "@/lib/games";
import type { ThreeArcade } from "@/lib/three-arcade";
import { ArcadeEngine } from "@/lib/arcade-engine";
import { reportFailure, recordDuration } from "@/lib/monitoring";
export function CanvasGame({ game, paused, onPause, onFinish }: { game: Game; paused: boolean; onPause: () => void; onFinish: (score: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), world = useRef<ArcadeWorld | null>(null), keys = useRef(new Set<string>()), pointer = useRef<{ x: number; y: number } | null>(null), pause = useRef(paused);
  const [hud, setHud] = useState({ score: 0, lives: 3, time: 0, over: false, won: false });
  const scene = useRef<ThreeArcade | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { pause.current = paused; if (paused) keys.current.clear(); }, [paused]);
  useEffect(() => {
    const state = new ArcadeWorld(game.id); world.current = state;
    const pressedKeys = keys.current;
    let cancelled = false;
    let frame = 0, previous = 0, update = 0, measured = 0, reported = false;
    const manager = new ArcadeEngine();
    const element = canvas.current;
    const lost = (event: Event) => { event.preventDefault(); cancelled = true; cancelAnimationFrame(frame); manager.dispose(); scene.current = null; setError("The graphics context was lost. Restart this game to recover."); reportFailure("webgl"); };
    element?.addEventListener("webglcontextlost", lost);
    const loop = (now: number) => {
      if (cancelled) return;
      const dt = previous ? Math.min(.035, (now - previous) / 1000) : 0; previous = now;
      if (!pause.current && !document.hidden) state.step(dt, keys.current, pointer.current);
      if (!document.hidden && !pause.current && (!state.over || !reported)) {
        const start = performance.now();
        try { scene.current?.update(state, pointer.current); } catch (error) { lost(new Event("webglcontextlost")); reportFailure("webgl", error); return; }
        if (now - measured > 5000) { measured = now; recordDuration("webgl.frame", performance.now() - start); }
      }
      if (now - update > 100) { update = now; setHud({ score: state.score, lives: state.lives, time: Math.floor(state.time), over: state.over, won: state.won }); }
      if (state.over && !reported) { reported = true; onFinish(state.score); }
      frame = requestAnimationFrame(loop);
    };
    if (element) manager.mount(element, game.id).then(engine => {
      if (cancelled || !engine) return;
      scene.current = engine; element.focus(); frame = requestAnimationFrame(loop);
    }).catch(error => { if (!cancelled) { reportFailure("webgl", error); setError("The 3D engine could not start. Check hardware acceleration and restart the game."); } });
    return () => { cancelled = true; element?.removeEventListener("webglcontextlost", lost); cancelAnimationFrame(frame); manager.dispose(); scene.current = null; world.current = null; pressedKeys.clear(); };
  }, [game.id, onFinish]);
  useEffect(() => {
    const normalize = (key: string) => ({ a: "ArrowLeft", d: "ArrowRight", w: "ArrowUp", s: "ArrowDown" }[key.toLowerCase()] ?? key);
    const down = (event: KeyboardEvent) => {
      if ((event.target as Element)?.closest("input,select,button")) return;
      if (event.key.toLowerCase() === "p") { if (!event.repeat) onPause(); return; }
      const key = normalize(event.key);
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(key)) return;
      event.preventDefault(); if (pause.current) return;
      if (!keys.current.has(key)) world.current?.input(key); keys.current.add(key);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(normalize(event.key));
    const blur = () => { keys.current.clear(); if (!pause.current) onPause(); };
    document.addEventListener("keydown", down); document.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { document.removeEventListener("keydown", down); document.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [onPause]);
  const position = (event: React.PointerEvent<HTMLCanvasElement>) => { const box = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - box.left) * 720 / box.width, y: (event.clientY - box.top) * 440 / box.height }; };
  return <div className="canvas-game"><div className="arcade-hud" aria-live="off"><span>Score <b>{hud.score}</b></span><span>Lives <b>{hud.lives}</b></span><span>Time <b>{hud.time}s</b></span><span className="arcade-3d-badge">3D</span></div><div className="arcade-screen"><canvas ref={canvas} width={720} height={440} aria-label={`${game.name} 3D playfield. ${game.controls}`} tabIndex={0} onPointerMove={event => { pointer.current = position(event); }} onPointerLeave={() => { pointer.current = null; }} onPointerDown={event => { if (paused) return; event.preventDefault(); event.currentTarget.focus(); const point = position(event); pointer.current = point; if (world.current) scene.current?.click(world.current, point.x, point.y); }} />{game.id === "fps" && <span className="arcade-crosshair" aria-hidden="true">+</span>}{error && <div className="arcade-overlay" role="alert"><p>{error}</p></div>}{(paused || hud.over) && <div className="arcade-overlay" role="status"><span>{hud.over ? hud.won ? "✦" : "↺" : "Ⅱ"}</span><h3>{hud.over ? hud.won ? "Challenge complete" : "Game over" : "Paused"}</h3><p>{hud.over ? `Final score: ${hud.score} · Restart to try again` : "Press P or Resume to continue"}</p></div>}</div><div className="arcade-touch" aria-label="Game controls">{[["ArrowLeft", "←"], ["ArrowUp", "↑"], ["ArrowDown", "↓"], ["ArrowRight", "→"], [" ", "Action"]].map(([key, label]) => <button key={key} disabled={paused || hud.over || !!error} aria-label={key === " " ? "Game action" : `Move ${label}`} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!keys.current.has(key)) world.current?.input(key); keys.current.add(key); } }} onKeyUp={() => keys.current.delete(key)} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keys.current.add(key); world.current?.input(key); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{label}</button>)}</div></div>;
}
