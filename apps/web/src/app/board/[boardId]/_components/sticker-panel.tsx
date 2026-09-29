"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

interface StickerPanelProps { onClose: () => void; onInsert: (value: string) => void; }

const stickers = [
  { value: "🏠", label: "House", group: "Stickers" }, { value: "💖", label: "Love", group: "Stickers" }, { value: "🚀", label: "Rocket", group: "Stickers" }, { value: "🎉", label: "Celebrate", group: "Stickers" },
  { value: "💡", label: "Idea", group: "Stickers" }, { value: "🔥", label: "Fire", group: "Stickers" }, { value: "✅", label: "Approved", group: "Stickers" }, { value: "📌", label: "Pin", group: "Stickers" },
  { value: "😀", label: "Happy", group: "Emojis" }, { value: "😍", label: "Love eyes", group: "Emojis" }, { value: "🤔", label: "Thinking", group: "Emojis" }, { value: "👏", label: "Applause", group: "Emojis" },
  { value: "👍", label: "Thumbs up", group: "Emojis" }, { value: "👀", label: "Watching", group: "Emojis" }, { value: "🤝", label: "Together", group: "Emojis" }, { value: "💬", label: "Discuss", group: "Emojis" },
  { value: "✨", label: "Sparkle", group: "GIFs" }, { value: "💫", label: "Spin", group: "GIFs" }, { value: "🎊", label: "Party", group: "GIFs" }, { value: "⚡", label: "Energy", group: "GIFs" },
];

export const StickerPanel = ({ onClose, onInsert }: StickerPanelProps) => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const [recent, setRecent] = useState<string[]>([]);
  const visible = useMemo(() => stickers.filter((item) => (tab === "All" || item.group === tab) && item.label.toLowerCase().includes(query.toLowerCase())), [query, tab]);
  const insert = (value: string) => { setRecent((items) => [value, ...items.filter((item) => item !== value)].slice(0, 6)); onInsert(value); };
  return <section className="sticker-panel" aria-label="Sticker library">
    <header><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stickers" /></label><button type="button" onClick={onClose} aria-label="Close sticker library"><X size={17} /></button></header>
    <nav>{["All", "Stickers", "Emojis", "GIFs"].map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
    {recent.length > 0 && <div className="sticker-panel__section"><p>Recent <button type="button" onClick={() => setRecent([])}>Clear</button></p><div>{recent.map((value, index) => <button key={`${value}-${index}`} type="button" onClick={() => insert(value)}>{value}</button>)}</div></div>}
    <div className="sticker-panel__section"><p>{tab === "All" ? "Interactive stickers" : tab}</p><div>{visible.map((item) => <button key={`${item.group}-${item.label}`} type="button" title={item.label} className={item.group === "GIFs" ? "is-animated" : ""} onClick={() => insert(item.value)}>{item.value}</button>)}</div></div>
  </section>;
};
