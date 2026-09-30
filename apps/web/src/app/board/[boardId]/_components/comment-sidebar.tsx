"use client";

import { useEffect, useState } from "react";
import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react";
import { MessageCircle, Plus, X } from "lucide-react";
import { Camera, Point } from "@/types/canvas";
import "@liveblocks/react-ui/styles.css";
import "./comment-sidebar.css";

export function CommentSidebar({ open, onClose, camera, zoom, point, placing, onPlace, onSubmitted, onOpen }: {
  open: boolean; onClose: () => void; camera: Camera; zoom: number; point: Point | null;
  placing: boolean; onPlace: () => void; onSubmitted: () => void; onOpen: () => void;
}) {
  const { threads, isLoading, error } = useThreads();
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [color, setColor] = useState("#81859b");
  useEffect(() => {
    if (!open || !selected) return;
    document.getElementById(`discussion-${selected}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open, selected, filter]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, onClose]);
  const visible = (threads ?? []).filter(thread => filter === "all" || (filter === "resolved" ? thread.resolved : !thread.resolved));
  return <>
    {(threads ?? []).map((thread, index) => typeof thread.metadata.x === "number" && typeof thread.metadata.y === "number" && <button key={thread.id} className={`comment-pin ${thread.resolved ? "is-resolved" : ""}`} style={{ left: camera.x + thread.metadata.x * zoom, top: camera.y + thread.metadata.y * zoom, background: thread.metadata.color || "#81859b" }} aria-label={`Open discussion ${index + 1}${thread.resolved ? ", resolved" : ""}`} onClick={() => { setSelected(thread.id); setFilter("all"); onOpen(); }}><MessageCircle size={16} />{index + 1}</button>)}
    {point && <span className="comment-pin comment-pin--draft" style={{ left: camera.x + point.x * zoom, top: camera.y + point.y * zoom, background: color }}><MessageCircle size={16} /></span>}
    {open && <aside className="comment-sidebar" aria-label="Board comments">
      <header><div><MessageCircle size={20} /><h2>Comments</h2><span>{threads?.length ?? 0}</span></div><button aria-label="Close comments" onClick={onClose}><X size={19} /></button></header>
      <div className="comment-sidebar__controls"><select aria-label="Filter comments" value={filter} onChange={event => setFilter(event.target.value)}><option value="open">Open discussions</option><option value="resolved">Resolved</option><option value="all">All discussions</option></select><button onClick={onPlace}><Plus size={15} /> Add pin</button></div>
      {placing && <p className="comment-sidebar__hint" role="status">Click anywhere on the board to place your comment.</p>}
      <div className="comment-sidebar__threads">
        {isLoading && <p role="status" className="comment-sidebar__empty">Loading discussions…</p>}
        {error && <p role="alert" className="comment-sidebar__empty">Comments could not load. Check your connection and reopen this panel.</p>}
        {!isLoading && !error && !visible.length && <div className="comment-sidebar__empty"><MessageCircle size={30} /><strong>{filter === "resolved" ? "No resolved discussions" : "Start a conversation"}</strong><p>Share feedback, reply to your team, and keep decisions together.</p></div>}
        {visible.map(thread => <div key={thread.id} id={`discussion-${thread.id}`} className={`comment-sidebar__thread ${selected === thread.id ? "is-selected" : ""}`}><Thread thread={thread} showResolveAction showReactions showActions showComposer="collapsed" /></div>)}
      </div>
      <div className="comment-sidebar__composer"><div className="comment-sidebar__composer-label"><span>{point ? "New pinned discussion" : "New board discussion"}</span><div aria-label="Comment pin color">{["#81859b", "#85c449", "#d90016", "#29b6db", "#25262b"].map(value => <button key={value} aria-label={`Pin color ${value}`} aria-pressed={color === value} style={{ background: value }} onClick={() => setColor(value)} />)}</div></div><Composer key={point ? `${point.x}-${point.y}` : "board"} metadata={{ ...(point ?? {}), color }} onComposerSubmit={onSubmitted} showAttachments={false} /></div>
    </aside>}
  </>;
}
