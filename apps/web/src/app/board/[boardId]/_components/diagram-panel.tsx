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
import { ShapePackId, shapeDefinitions, shapePacks } from "@/lib/diagram-shapes";

const selectionSchema = z.array(z.enum(["basic", "flowchart", "connectors", "callouts", "uml", "erd", "aws"]));
const defaultPacks: ShapePackId[] = ["basic", "flowchart", "connectors", "callouts"];

const glyphs: Record<DiagramShapeKind, ComponentType<{ className?: string }>> = {
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
              {shapePacks.map((pack) => <button key={pack.id} onClick={() => onToggle(pack.id)} className={enabled.includes(pack.id) ? "is-enabled" : ""}><span><Shapes className="size-5" /></span><strong>{pack.label}</strong><small>{pack.description}</small></button>)}
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("flowboard-shape-packs");
      if (!saved) return;
      const parsed = selectionSchema.safeParse(JSON.parse(saved));
      if (parsed.success) setEnabledPacks(parsed.data);
    } catch {
      window.localStorage.removeItem("flowboard-shape-packs");
    }
  }, []);

  const togglePack = (pack: ShapePackId) => {
    setEnabledPacks((current) => {
      const next = current.includes(pack) ? current.filter((id) => id !== pack) : [...current, pack];
      window.localStorage.setItem("flowboard-shape-packs", JSON.stringify(next));
      return next;
    });
  };

  const groupedShapes = useMemo(() => enabledPacks.map((packId) => ({
    pack: shapePacks.find((pack) => pack.id === packId)!,
    shapes: shapeDefinitions.filter((shape) => shape.pack === packId && shape.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((group) => group.pack && group.shapes.length), [enabledPacks, search]);

  return (
    <>
      <aside className="diagram-panel" aria-label="Diagramming shapes">
        <header><strong>Diagramming shapes</strong><span><Download className="size-4" /><button onClick={onClose} aria-label="Close shapes"><X className="size-4" /></button></span></header>
        <label className="diagram-panel__search"><Search className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shapes" /></label>
        <div className="diagram-panel__content">
          {groupedShapes.map(({ pack, shapes }) => <section key={pack.id}><h3>{pack.label}</h3><div className="diagram-panel__grid">{shapes.map((shape) => { const Icon = glyphs[shape.kind]; return <button key={shape.id} onClick={() => onInsertShape(shape.kind)} title={shape.label} aria-label={`Insert ${shape.label}`}><Icon className="size-7" /></button>; })}</div></section>)}
          {!groupedShapes.length && <div className="diagram-panel__empty"><Shapes className="size-8" /><p>No enabled shapes match “{search}”.</p></div>}
        </div>
        <footer><button onClick={() => setManagerOpen(true)}>Manage shapes</button><button onClick={onCreateDiagram}><Workflow className="size-4" /> Create diagram</button></footer>
      </aside>
      <ShapePackManager open={managerOpen} onOpenChange={setManagerOpen} enabled={enabledPacks} onToggle={togglePack} />
    </>
  );
};
