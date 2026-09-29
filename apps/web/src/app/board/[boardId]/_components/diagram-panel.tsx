"use client";

import { ComponentType, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Cloud,
  Database,
  Diamond,
  Download,
  FileText,
  Hexagon,
  MessageSquare,
  Minus,
  MoveRight,
  GitBranch,
  Plus,
  Search,
  Server,
  Shapes,
  Star,
  Triangle,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiagramShapeKind } from "@/types/canvas";
import { getShapesForPack, ShapePackId, shapePackIds, shapePacks } from "@/lib/diagram-shapes";

const selectionSchema = z.array(z.enum(shapePackIds));
const defaultPacks: ShapePackId[] = [...shapePackIds];
const storageKey = "flowboard-shape-packs-v2";

const glyphs: Record<DiagramShapeKind, ComponentType<{ className?: string }>> = {
  line: Minus,
  arrow: MoveRight,
  "elbow-arrow": GitBranch,
  "block-arrow": ArrowRight,
  divider: Minus,
  rectangle: Shapes,
  rounded: Shapes,
  circle: Circle,
  triangle: Triangle,
  diamond: Diamond,
  star: Star,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  hexagon: Hexagon,
  database: Database,
  cloud: Cloud,
  plus: Plus,
  document: FileText,
  parallelogram: Shapes,
  terminator: Circle,
  actor: UserRound,
  server: Server,
  callout: MessageSquare,
};

interface ShapePackManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: ShapePackId[];
  onToggle: (pack: ShapePackId) => void;
}

const ShapePackManager = ({ open, onOpenChange, enabled, onToggle }: ShapePackManagerProps) => {
  const [search, setSearch] = useState("");
  const visiblePacks = shapePacks.filter((pack) => pack.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shape-manager max-w-[780px] p-0 overflow-hidden bg-white">
        <DialogHeader className="border-b px-7 py-5">
          <DialogTitle>Add shape packs</DialogTitle>
          <DialogDescription>Choose the libraries shown in your Diagramming shapes panel.</DialogDescription>
        </DialogHeader>
        <div className="shape-manager__body">
          <aside>
            <label><Search className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shape packs" /></label>
            <p>Flowboard shapes</p>
            {visiblePacks.map((pack) => (
              <button key={pack.id} onClick={() => onToggle(pack.id)}>
                <span className={enabled.includes(pack.id) ? "shape-pack-check shape-pack-check--active" : "shape-pack-check"}>{enabled.includes(pack.id) ? "✓" : ""}</span>
                {pack.label}
              </button>
            ))}
          </aside>
          <section>
            <div className="shape-manager__banner"><strong>Build richer system diagrams</strong><span>Enable cloud, data, UML, flowchart, callout, and connector packs for your team workspace.</span></div>
            <h3>Available collections</h3>
            <div className="shape-manager__cards">
              {shapePacks.map((pack) => <button key={pack.id} onClick={() => onToggle(pack.id)} className={enabled.includes(pack.id) ? "is-enabled" : ""}><span style={{ color: pack.color }}><Shapes className="size-5" /></span><strong>{pack.label}</strong><small>{pack.description} · {pack.shapeCount} shapes</small></button>)}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface DiagramPanelProps {
  onClose: () => void;
  onInsertShape: (kind: DiagramShapeKind) => void;
  onCreateDiagram: () => void;
}

export const DiagramPanel = ({ onClose, onInsertShape, onCreateDiagram }: DiagramPanelProps) => {
  const [search, setSearch] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);
  const [enabledPacks, setEnabledPacks] = useState<ShapePackId[]>(defaultPacks);
  const [expandedPacks, setExpandedPacks] = useState<ShapePackId[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = selectionSchema.safeParse(JSON.parse(saved));
      if (parsed.success) setEnabledPacks(parsed.data);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const togglePack = (pack: ShapePackId) => {
    setEnabledPacks((current) => {
      const next = current.includes(pack) ? current.filter((id) => id !== pack) : [...current, pack];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const groupedShapes = useMemo(() => enabledPacks.map((packId) => ({
    pack: shapePacks.find((pack) => pack.id === packId)!,
    shapes: getShapesForPack(packId).filter((shape) => shape.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((group) => group.pack && group.shapes.length), [enabledPacks, search]);

  const exportPackConfig = () => {
    const blob = new Blob([JSON.stringify({ version: 2, enabledPacks }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "flowboard-shape-packs.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <aside className="diagram-panel" aria-label="Diagramming shapes">
        <header><strong>Diagramming shapes</strong><span><button onClick={exportPackConfig} title="Export shape-pack configuration" aria-label="Export shape-pack configuration"><Download className="size-4" /></button><button onClick={onClose} aria-label="Close shapes"><X className="size-4" /></button></span></header>
        <label className="diagram-panel__search"><Search className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shapes" /></label>
        <div className="diagram-panel__content">
          {groupedShapes.map(({ pack, shapes }) => {
            const expanded = Boolean(search) || expandedPacks.includes(pack.id);
            const visibleShapes = expanded ? shapes : shapes.slice(0, 6);
            return <details key={pack.id} open><summary><strong>{pack.label}</strong><span>{pack.shapeCount} shapes</span></summary><div className="diagram-panel__grid">{visibleShapes.map((shape) => { const Icon = glyphs[shape.kind]; return <button key={shape.id} onClick={() => onInsertShape(shape.kind)} title={shape.label} aria-label={`Insert ${shape.label}`} style={{ color: shape.color || pack.color }}><Icon className="size-7" /></button>; })}</div>{!search && <button className="diagram-panel__count" onClick={() => setExpandedPacks((current) => current.includes(pack.id) ? current.filter((id) => id !== pack.id) : [...current, pack.id])}>{expanded ? "Show fewer" : `+${pack.shapeCount} shapes`}</button>}</details>;
          })}
          {!groupedShapes.length && <div className="diagram-panel__empty"><Shapes className="size-8" /><p>No enabled shapes match “{search}”.</p></div>}
        </div>
        <footer><button onClick={() => setManagerOpen(true)}>Manage shapes</button><button onClick={onCreateDiagram}><Workflow className="size-4" /> Create diagram</button></footer>
      </aside>
      <ShapePackManager open={managerOpen} onOpenChange={setManagerOpen} enabled={enabledPacks} onToggle={togglePack} />
    </>
  );
};
