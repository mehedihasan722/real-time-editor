import { Bot, CalendarDays, ClipboardList, FileText, GitBranch, LayoutDashboard, Map, MessagesSquare, PanelsTopLeft, Shapes } from "lucide-react";
import type { CSSProperties } from "react";

const identities = [
  { match: /\bai\b|playground|assist/i, label: "AI Playground", icon: Bot, kind: "chat", color: "#7c3aed" },
  { match: /requirement|product brief/i, label: "Product requirements", icon: FileText, kind: "document", color: "#2563eb" },
  { match: /weekly|check.in/i, label: "Weekly update", icon: CalendarDays, kind: "weekly", color: "#0891b2" },
  { match: /roadmap/i, label: "Roadmap", icon: Map, kind: "roadmap", color: "#4f46e5" },
  { match: /retro/i, label: "Retrospective", icon: MessagesSquare, kind: "retro", color: "#059669" },
  { match: /to.do|task|kanban/i, label: "Task planning", icon: ClipboardList, kind: "tasks", color: "#d97706" },
  { match: /flow|diagram|journey/i, label: "Flowchart", icon: GitBranch, kind: "flow", color: "#db2777" },
  { match: /prototype|wireframe/i, label: "Prototype", icon: PanelsTopLeft, kind: "prototype", color: "#0284c7" },
  { match: /brainstorm|mind.map/i, label: "Brainstorm", icon: Shapes, kind: "flow", color: "#9333ea" },
];

export function boardIdentity(title: string) {
  return identities.find(identity => identity.match.test(title)) ?? { label: "Whiteboard", icon: LayoutDashboard, kind: "blank", color: "#64748b" };
}

export function BoardTypeIcon({ title }: { title: string }) {
  const { icon: Icon, label, color } = boardIdentity(title);
  return <span className="board-type-icon" title={label} style={{ "--board-icon-accent": color } as CSSProperties}><Icon size={19} role="img" aria-label={label} /></span>;
}

export function BoardPreview({ title, id }: { title: string; id: string }) {
  const { label, color, kind } = boardIdentity(title);
  const seed = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const shift = seed % 3 * 8;
  return <div className="board-type-preview" style={{ "--preview-accent": color } as CSSProperties}>
    <svg viewBox="0 0 400 220" role="img" aria-label={`${label} preview for ${title}`}>
      <rect x="25" y="18" width="350" height="188" rx="12" className="preview-surface" />
      <path d="M25 48H375" className="preview-line" /><circle cx="40" cy="33" r="4" fill={color} /><rect x="51" y="30" width="90" height="6" rx="3" className="preview-muted" />
      {kind === "chat" ? <><rect x="40" y="63" width="70" height="124" rx="6" className="preview-muted" />{[73, 107, 141].map((y, index) => <rect key={y} x={index % 2 ? 158 : 130} y={y} width={150 + shift} height="23" rx="7" fill={index % 2 ? color : "currentColor"} opacity={index % 2 ? .65 : .15} />)}<rect x="130" y="177" width="225" height="11" rx="5" className="preview-muted" /></> :
      kind === "document" ? <>{[70, 87, 103].map(y => <rect key={y} x="65" y={y} width={y === 70 ? 190 : 270} height={y === 70 ? 10 : 5} rx="2" className="preview-muted" />)}{[0, 1, 2].map(index => <g key={index}><rect x={65 + index * 94} y="126" width="80" height="52" rx="6" fill={color} opacity={.13 + index * .08} /><rect x={77 + index * 94} y="140" width="40" height="5" rx="2" fill={color} /></g>)}</> :
      kind === "flow" || kind === "roadmap" ? <><path d="M100 90H200V143H300M100 90V160H200" className="preview-connector" />{[[60, 70], [170, 70 + shift], [170, 140], [280, 125]].map(([x, y], index) => <g key={index}><rect x={x} y={y} width="65" height="36" rx={kind === "flow" ? 12 : 5} fill={color} opacity={.2 + index * .12} /><rect x={x + 10} y={y + 12} width="40" height="4" rx="2" fill={color} /></g>)}</> :
      kind === "retro" || kind === "tasks" ? <>{[0, 1, 2].map(column => <g key={column}><rect x={48 + column * 105} y="65" width="94" height="120" rx="6" className="preview-muted" /><rect x={61 + column * 105} y="75" width="62" height="5" rx="2" fill={color} />{[0, 1, 2].slice(0, 1 + (column + seed) % 3).map(row => <rect key={row} x={56 + column * 105} y={94 + row * 28} width="78" height="21" rx="4" fill={color} opacity={.2 + column * .16} />)}</g>)}</> :
      kind === "weekly" ? <>{[0, 1, 2, 3, 4].map(index => <circle key={index} cx={100 + index * 45} cy="78" r="11" fill={color} opacity={index === seed % 5 ? .8 : .2} />)}{[108, 134, 160].map(y => <g key={y}><rect x="65" y={y} width="270" height="18" rx="4" className="preview-muted" /><rect x="74" y={y + 5} width="8" height="8" rx="2" fill={color} /></g>)}</> :
      kind === "prototype" ? <><rect x="55" y="66" width="175" height="117" rx="6" className="preview-muted" /><rect x="70" y="80" width="145" height="45" rx="4" fill={color} opacity=".3" /><rect x="252" y="64" width="67" height="124" rx="11" className="preview-connector" />{[91, 115, 139].map(y => <rect key={y} x="264" y={y} width="42" height="15" rx="3" fill={color} opacity=".4" />)}</> :
      <>{[[75, 85], [173, 68], [263, 111]].map(([x, y], index) => <g key={index} transform={`rotate(${(seed + index) % 9 - 4} ${x} ${y})`}><rect x={x} y={y} width="67" height="65" rx="5" fill={color} opacity={.2 + index * .12} /><path d={`M${x + 10} ${y + 20}h42m-42 12h33m-33 12h38`} className="preview-line" /></g>)}</>}
    </svg><span className="board-type-label"><BoardTypeIcon title={title} />{label} · {id.slice(-4)}</span>
  </div>;
}
