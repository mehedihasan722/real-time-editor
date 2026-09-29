"use client";

import { DiagramShapeKind } from "@/types/canvas";
import { ArrowRight, Circle, Diamond, GitBranch, Minus, MoveRight, RectangleHorizontal, Triangle, Workflow } from "lucide-react";

interface ShapeMenuProps {
  onSelect: (kind: DiagramShapeKind) => void;
  onMoreShapes: () => void;
}

const items: { label: string; shortcut?: string; kind: DiagramShapeKind; icon: typeof Minus }[] = [
  { label: "Line", shortcut: "L", kind: "line", icon: Minus },
  { label: "Arrow", kind: "arrow", icon: MoveRight },
  { label: "Elbow arrow", kind: "elbow-arrow", icon: GitBranch },
  { label: "Block arrow", kind: "block-arrow", icon: ArrowRight },
  { label: "Rectangle", shortcut: "R", kind: "rectangle", icon: RectangleHorizontal },
  { label: "Oval", shortcut: "O", kind: "circle", icon: Circle },
  { label: "Rhombus", kind: "diamond", icon: Diamond },
  { label: "Triangle", kind: "triangle", icon: Triangle },
  { label: "Divider", kind: "divider", icon: Minus },
];

export const ShapeMenu = ({ onSelect, onMoreShapes }: ShapeMenuProps) => (
  <div className="shape-quick-menu" role="menu" aria-label="Shapes and lines">
    {items.map(({ label, shortcut, kind, icon: Icon }, index) => (
      <button key={kind} type="button" role="menuitem" className={index === 4 ? "shape-quick-menu__separated" : ""} onClick={() => onSelect(kind)}>
        <Icon size={17} /><span>{label}</span>{shortcut && <kbd>{shortcut}</kbd>}
      </button>
    ))}
    <button type="button" onClick={onMoreShapes}><span className="shape-menu-spacer" /> <span>More shapes</span></button>
    <button type="button" className="shape-quick-menu__separated" onClick={onMoreShapes}><Workflow size={17} /><span>Diagram</span></button>
  </div>
);
