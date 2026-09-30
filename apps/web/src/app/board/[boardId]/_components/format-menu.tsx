"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Code2, Columns3, Eraser, FileText, Frame, Gamepad2, GitBranch, Grid3X3, Image, Layers3, MessageCircle, Network, Presentation, Search, Shapes, Smartphone, Sparkles, Sticker, StickyNote, Table2, Type, Upload, Users, Video, Workflow } from "lucide-react";

type ToolAction = "template" | "diagram" | "frames" | "shapes" | "stickers" | "eraser" | "note" | "text" | "comment";
interface ToolOption { label: string; description: string; action: ToolAction; template?: string; icon: typeof Search; color?: string; }
interface ToolGroup { label: string; items: ToolOption[]; }

const groups: ToolGroup[] = [
  { label: "Formats", items: [
    { label: "Prototype", description: "Visualize concepts and build interactive flows", action: "template", template: "Prototype", icon: Smartphone, color: "#745df3" },
    { label: "Diagram", description: "Build free-form diagrams with editable shapes", action: "diagram", icon: Workflow, color: "#f97316" },
    { label: "Table", description: "Structure your data using a table", action: "template", template: "Table", icon: Table2, color: "#16a34a" },
    { label: "Timeline", description: "Plan your work using a timeline", action: "template", template: "Timeline", icon: CalendarDays, color: "#16a34a" },
    { label: "Kanban", description: "Visualize workflows with multi-view options", action: "template", template: "Kanban", icon: Columns3, color: "#22c55e" },
    { label: "Doc", description: "Organize your thoughts in a document", action: "template", template: "Doc", icon: FileText, color: "#0ea5e9" },
    { label: "Slides", description: "Showcase your work with slides", action: "template", template: "Slides", icon: Presentation, color: "#fb7185" },
    { label: "Engage activities", description: "Run team-friendly interactive sessions", action: "template", template: "Engage activities", icon: Gamepad2, color: "#f43f5e" },
    { label: "Talktrack", description: "Plan a video walkthrough and feedback", action: "template", template: "Talktrack", icon: Video, color: "#14b8a6" },
  ]},
  { label: "Essentials", items: [
    { label: "Eraser", description: "Remove freehand paths", action: "eraser", icon: Eraser },
    { label: "Sticky note", description: "Capture an idea with author and formatting", action: "note", icon: StickyNote },
    { label: "Card", description: "Organize and assign work", action: "template", template: "Kanban", icon: Layers3 },
    { label: "Code block", description: "Create a collaborative technical note", action: "template", template: "Doc", icon: Code2 },
    { label: "Comment", description: "Start a board discussion", action: "comment", icon: MessageCircle },
    { label: "Frame", description: "Add structure to the board", action: "frames", icon: Frame },
    { label: "Grid", description: "Organize information in a grid", action: "template", template: "Table", icon: Grid3X3 },
    { label: "Mind map", description: "Create a connected idea map", action: "template", template: "Flowchart", icon: Network },
    { label: "Text", description: "Select the text creation tool", action: "text", icon: Type },
  ]},
  { label: "Diagramming", items: [
    { label: "Diagramming shapes", description: "Browse all basic and technical shape packs", action: "diagram", icon: Workflow },
    { label: "Shapes and lines", description: "Insert lines, arrows, and geometric shapes", action: "shapes", icon: Shapes },
    { label: "AWS Cloud View", description: "Open the AWS and architecture shape library", action: "diagram", icon: Network },
  ]},
  { label: "Planning", items: [
    { label: "Columns", description: "Group and organize tasks", action: "template", template: "Kanban", icon: Columns3 },
    { label: "Dependencies", description: "Define and visualize dependencies", action: "template", template: "Flowchart", icon: GitBranch },
    { label: "User story mapping", description: "Create and edit story maps", action: "template", template: "Roadmap", icon: Grid3X3 },
  ]},
  { label: "Collaboration", items: [
    { label: "Poll", description: "Create an open team question", action: "note", icon: MessageCircle },
    { label: "Dot voting", description: "Add voting markers as stickers", action: "stickers", icon: Sparkles },
    { label: "People", description: "Plan roles and team members", action: "template", template: "Table", icon: Users },
  ]},
  { label: "Media", items: [
    { label: "Stickers, Emoji and GIFs", description: "Express ideas with offline sticker artwork", action: "stickers", icon: Sticker },
    { label: "Images and icons", description: "Use the sticker and icon library", action: "stickers", icon: Image },
    { label: "Upload", description: "Plan uploaded assets in a collaborative doc", action: "template", template: "Doc", icon: Upload },
  ]},
];

interface FormatMenuProps { onSelect: (template: string) => void; onAction: (action: Exclude<ToolAction, "template">) => void; }

export const FormatMenu = ({ onSelect, onAction }: FormatMenuProps) => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"Tools" | "Marketplace">("Tools");
  const visible = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => (item.label + " " + item.description).toLowerCase().includes(query.toLowerCase())) })).filter((group) => group.items.length), [query]);
  const shown = tab === "Tools" ? visible : visible.filter((group) => ["Diagramming", "Media"].includes(group.label));
  const run = (item: ToolOption) => item.action === "template" && item.template ? onSelect(item.template) : onAction(item.action as Exclude<ToolAction, "template">);
  return <section className="format-menu" aria-label="Tools and marketplace">
    <label className="tools-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools..." /></label>
    <nav className="tools-tabs"><button type="button" className={tab === "Tools" ? "is-active" : ""} onClick={() => setTab("Tools")}>Tools</button><button type="button" className={tab === "Marketplace" ? "is-active" : ""} onClick={() => setTab("Marketplace")}>Marketplace</button></nav>
    <div className="tools-list">{shown.map((group) => <div key={group.label} className="tools-group"><h3>{group.label}</h3>{group.items.map((item) => <button key={item.label} type="button" onClick={() => run(item)}><span><item.icon size={18} style={{ color: item.color }} /></span><div><strong>{item.label}</strong><small>{item.description}</small></div></button>)}</div>)}</div>
  </section>;
};
