"use client";
import { useEffect, useRef, useState } from "react";
import { GameId } from "@/lib/games";
import { lineWinner, mergeTiles, mineNeighbors } from "@/lib/game-rules";
const flowers = ["🌸", "🌻", "🍀", "🌵", "🍄", "🌷", "🌿", "🌺"];
function addTile(board: number[]) { const copy = [...board], empty = copy.map((value, index) => value ? -1 : index).filter(index => index >= 0); if (empty.length) copy[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < .9 ? 2 : 4; return copy; }
export function PuzzleGame({ id, onFinish }: { id: GameId; onFinish: (score: number) => void }) {
  const [board, setBoard] = useState<number[]>(() => id === "memory" ? [...Array(16)].map((_, i) => i % 8).map(value => ({ value, order: Math.random() })).sort((a, b) => a.order - b.order).map(item => item.value) : id === "2048" ? addTile(addTile(Array(16).fill(0))) : Array(id === "mines" ? 64 : id === "connect" ? 42 : 9).fill(0));
  const [revealed, setRevealed] = useState<number[]>([]), [matched, setMatched] = useState<number[]>([]), [mines, setMines] = useState<number[]>([]), [flags, setFlags] = useState<number[]>([]), [flagMode, setFlagMode] = useState(false);
  const [score, setScore] = useState(0), [moves, setMoves] = useState(0), [status, setStatus] = useState("");
  const [sequence, setSequence] = useState<number[]>(() => [Math.floor(Math.random() * 4)]), [echo, setEcho] = useState(0), [flash, setFlash] = useState(-1), [watching, setWatching] = useState(true);
  const finished = useRef(false);
  useEffect(() => { if (status && !finished.current) { finished.current = true; onFinish(score); } }, [status, score, onFinish]);
  useEffect(() => {
    if (id !== "memory" || revealed.length !== 2) return;
    const timer = setTimeout(() => setRevealed([]), 750); return () => clearTimeout(timer);
  }, [id, revealed]);
  useEffect(() => {
    if (id !== "simon" || status) return;
    const timers = sequence.flatMap((value, index) => [setTimeout(() => setFlash(value), 600 + index * 700), setTimeout(() => setFlash(-1), 1050 + index * 700)]);
    timers.push(setTimeout(() => setWatching(false), sequence.length * 700 + 600));
    return () => timers.forEach(clearTimeout);
  }, [id, sequence, status]);
  const slide = (direction: number) => {
    if (status || id !== "2048") return;
    const result = mergeTiles(board, direction); if (!result.changed) return;
    const next = addTile(result.board); setBoard(next); setMoves(moves + 1); setScore(score + result.score);
    if (next.includes(2048)) setStatus("You reached 2048!");
    else if ([0, 1, 2, 3].every(dir => !mergeTiles(next, dir).changed)) setStatus("No moves left");
  };
  useEffect(() => {
    if (id !== "2048") return;
    const handler = (event: KeyboardEvent) => { const direction = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(event.key); if (direction >= 0 && !(event.target as Element)?.closest("input,select,button")) { event.preventDefault(); slide(direction); } };
    document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler);
  });
  const choose = (index: number, nextColor = 0) => {
    if (status) return;
    if (id === "memory") {
      if (revealed.length === 2 || revealed.includes(index) || matched.includes(index)) return;
      const next = [...revealed, index]; setRevealed(next);
      if (next.length === 2) { setMoves(moves + 1); if (board[next[0]] === board[next[1]]) { const pairs = [...matched, ...next]; setMatched(pairs); setScore(score + 100); if (pairs.length === 16) { setScore(Math.max(100, 1600 - moves * 20)); setStatus("Every pair found!"); } } }
    }
    if (id === "mines") {
      if (revealed.includes(index)) return;
      if (flagMode) { if (flags.includes(index)) setFlags(flags.filter(value => value !== index)); else if (flags.length < 10) setFlags([...flags, index]); return; }
      if (flags.includes(index)) return;
      let hazards = mines;
      if (!hazards.length) { const excluded = [index, ...mineNeighbors(index)]; hazards = Array.from({ length: 64 }, (_, i) => i).filter(i => !excluded.includes(i)).map(value => ({ value, order: Math.random() })).sort((a, b) => a.order - b.order).slice(0, 10).map(item => item.value); setMines(hazards); }
      if (hazards.includes(index)) { setStatus("Mine found — try again!"); return; }
      const opened = new Set(revealed), queue = [index];
      while (queue.length) { const cell = queue.pop()!; if (opened.has(cell) || flags.includes(cell)) continue; opened.add(cell); if (!mineNeighbors(cell).some(value => hazards.includes(value))) queue.push(...mineNeighbors(cell).filter(value => !hazards.includes(value) && !opened.has(value))); }
      setRevealed([...opened]); setScore(opened.size * 10); if (opened.size === 54) setStatus("All safe squares cleared!");
    }
    if (id === "tictactoe" || id === "connect") {
      const columns = id === "connect" ? 7 : 3, rows = id === "connect" ? 6 : 3, length = id === "connect" ? 4 : 3;
      const target = (cells: number[], column: number) => id === "connect" ? Array.from({ length: 6 }, (_, i) => (5 - i) * 7 + column).find(i => !cells[i]) : !cells[column] ? column : undefined;
      const next = [...board], position = target(next, index); if (position === undefined) return; next[position] = 1;
      const winner = lineWinner(next, columns, rows, length); if (winner) { setBoard(next); setScore(500); setStatus("You win!"); return; }
      const possible = Array.from({ length: id === "connect" ? 7 : 9 }, (_, i) => target(next, i)).filter((value): value is number => value !== undefined);
      const winningMove = (player: number) => possible.find(cell => { const copy = [...next]; copy[cell] = player; return lineWinner(copy, columns, rows, length) === player; });
      const center = id === "connect" ? possible.find(cell => cell % 7 === 3) : possible.find(cell => cell === 4);
      const computer = winningMove(2) ?? winningMove(1) ?? center ?? possible[0]; if (computer !== undefined) next[computer] = 2;
      setBoard(next); setMoves(moves + 1); if (lineWinner(next, columns, rows, length)) setStatus("Computer wins — rematch?"); else if (next.every(Boolean)) { setScore(100); setStatus("It's a draw"); }
    }
    if (id === "simon" && !watching) {
      if (index !== sequence[echo]) { setStatus("Sequence missed — try again!"); return; }
      if (echo + 1 === sequence.length) { setScore(sequence.length * 100); setEcho(0); setWatching(true); setSequence([...sequence, nextColor]); } else setEcho(echo + 1);
    }
  };
  return <div className="puzzle-stage"><div className="puzzle-status" role="status"><span>Score <b>{score}</b></span><span>{id === "simon" ? watching ? "Watch the lights" : `Repeat · ${echo}/${sequence.length}` : `Turns ${moves}`}</span></div>
    {id === "mines" && <button className="arcade-button" onClick={() => setFlagMode(!flagMode)} aria-pressed={flagMode}>{flagMode ? "🚩 Flag mode" : "🔍 Reveal mode"} · {flags.length}/10 flags</button>}
    {id === "simon" ? <div className="simon-grid">{["#a78bfa", "#34d399", "#fb7185", "#fbbf24"].map((color, i) => <button key={color} aria-label={["Purple", "Green", "Pink", "Yellow"][i]} disabled={watching || !!status} onClick={() => choose(i, Math.floor(Math.random() * 4))} className={flash === i ? "lit" : ""} style={{ background: color }}>{i + 1}</button>)}</div> : <>
      {id === "connect" && <div className="connect-controls">{Array.from({ length: 7 }, (_, i) => <button key={i} onClick={() => choose(i)} disabled={!!status} aria-label={`Drop in column ${i + 1}`}>↓</button>)}</div>}
      <div className={`puzzle-grid puzzle-grid--${id}`}>
        {board.map((value, i) => {
          const visible = revealed.includes(i) || matched.includes(i), adjacent = mineNeighbors(i).filter(cell => mines.includes(cell)).length;
          const content = id === "memory" ? visible ? flowers[value] : "?" : id === "mines" ? flags.includes(i) ? "🚩" : status && mines.includes(i) ? "💣" : revealed.includes(i) ? adjacent || "" : "" : id === "2048" ? value || "" : id === "connect" ? value === 1 ? "🔴" : value === 2 ? "🟡" : "" : value === 1 ? "X" : value === 2 ? "O" : "";
          return <button key={i} onClick={() => choose(id === "connect" ? i % 7 : i)} disabled={!!status || id === "2048" || (id === "memory" && matched.includes(i))} aria-label={id === "memory" ? `Card ${i + 1}${visible ? ` ${flowers[value]}` : ", hidden"}` : `Square ${i + 1}: ${content || "empty"}`} className={`${visible ? "revealed" : ""} ${matched.includes(i) ? "matched" : ""} ${value ? "filled" : ""}`}>{content}</button>;
        })}
      </div></>}
    {id === "2048" && <div className="arcade-touch">{["←", "→", "↑", "↓"].map((label, i) => <button key={label} onClick={() => slide(i)} aria-label={`Slide ${label}`}>{label}</button>)}</div>}
    {status && <div className="puzzle-result" role="status"><h3>{status}</h3><p>Use Restart above to play again.</p></div>}
  </div>;
}
