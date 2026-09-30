"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, Pause, Play, RotateCcw, Search, Trophy } from "lucide-react";
import { games, Game, puzzleIds } from "@/lib/games";
import { CanvasGame } from "./canvas-game";
import { PuzzleGame } from "./puzzle-game";
import "./games.css";
const categories = ["All games", "Action", "Sports", "Racing", "Adventure", "Classics", "Puzzle", "Strategy"];
export default function GamesPage() {
  const [active, setActive] = useState<Game | null>(null), [category, setCategory] = useState("All games"), [search, setSearch] = useState(""), [session, setSession] = useState(0), [paused, setPaused] = useState(false), [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    try { const parsed = JSON.parse(localStorage.getItem("flowboard-arcade-scores") || "{}"); if (parsed && typeof parsed === "object") { const scores = Object.fromEntries(Object.entries(parsed).filter(([id, value]) => games.some(game => game.id === id) && typeof value === "number" && Number.isFinite(value) && value >= 0)); const timer = setTimeout(() => setBest(scores as Record<string, number>), 0); return () => clearTimeout(timer); } } catch { /* Storage is optional. */ }
  }, []);
  const finish = useCallback((score: number) => {
    if (!active) return;
    setBest(previous => { const next = { ...previous, [active.id]: Math.max(previous[active.id] ?? 0, score) }; try { localStorage.setItem("flowboard-arcade-scores", JSON.stringify(next)); } catch { /* Play still works without storage. */ } return next; });
  }, [active]);
  const togglePause = useCallback(() => setPaused(value => !value), []);
  const filtered = games.filter(game => (category === "All games" || game.category === category) && `${game.name} ${game.description} ${game.category}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="flowboard-arcade"><header className="arcade-heading"><div><span className="arcade-eyebrow"><Gamepad2 size={15} /> FLOWBOARD ARCADE</span><h1>A little break.<br /><span>A new high score.</span></h1><p>22 mini-games. Pick your challenge and press play.</p></div><div className="arcade-heading-stat"><span>✦</span><strong>22</strong><small>games to explore</small></div></header>
    {active ? <div className="arcade-player"><div className="arcade-player-header"><button className="arcade-button" onClick={() => { setActive(null); setPaused(false); }}><ArrowLeft size={15} /> Library</button><div><h2>{active.emoji} {active.name}</h2><span><Trophy size={12} /> Best {best[active.id] ?? 0} · Solo play</span></div><div className="arcade-player-actions">{!puzzleIds.includes(active.id) && <button className="arcade-button" onClick={togglePause}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? "Resume" : "Pause"}</button>}<button className="arcade-button" onClick={() => { setSession(value => value + 1); setPaused(false); }}><RotateCcw size={14} /> Restart</button></div></div>
      {puzzleIds.includes(active.id) ? <PuzzleGame key={`${active.id}-${session}`} id={active.id} onFinish={finish} /> : <CanvasGame key={`${active.id}-${session}`} game={active} paused={paused} onPause={togglePause} onFinish={finish} />}
      <div className="arcade-instructions"><strong>HOW TO PLAY</strong><p>{active.controls}</p><small>Best scores are saved on this device. Canvas games: P to pause.</small></div></div> : <>
      <div className="arcade-discovery"><nav aria-label="Game categories">{categories.map(value => <button key={value} className={category === value ? "selected" : ""} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</nav><label><Search size={16} /><input aria-label="Search games" placeholder="Find your next game…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="arcade-library">{filtered.map((game, index) => <button key={game.id} className="arcade-card" onClick={() => { setActive(game); setSession(value => value + 1); setPaused(false); }} style={{ "--card-hue": `${(index * 43 + 245) % 360}` } as React.CSSProperties}><div className="arcade-card-art"><span className="arcade-card-category">{game.category}</span><span className="arcade-card-emoji" aria-hidden="true">{game.emoji}</span><span className="arcade-card-play"><Play size={18} fill="currentColor" /></span></div><div className="arcade-card-body"><h2>{game.name}</h2><p>{game.description}</p><div><span><Trophy size={12} /> {best[game.id] ? `Best ${best[game.id]}` : "Set your first score"}</span><strong>Play now ↗</strong></div></div></button>)}</div>{!filtered.length && <p className="arcade-empty">No games match your search. Try another title or category.</p>}</>}
    <footer className="arcade-note">Original browser mini-games · No downloads · Keyboard & touch controls</footer>
  </section>;
}
