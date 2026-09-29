"use client";

import { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Columns3,
  FileText,
  Gamepad2,
  GitBranch,
  Presentation,
  Smartphone,
  Table2,
  Video,
  Workflow,
} from "lucide-react";

interface FormatOption {
  label: string;
  template: string;
  icon: LucideIcon;
  color: string;
  isNew?: boolean;
  separated?: boolean;
}

const formats: FormatOption[] = [
  { label: "Prototype", template: "Prototype", icon: Smartphone, color: "#745df3" },
  { label: "Diagram", template: "Diagram", icon: Workflow, color: "#f97316" },
  { label: "Table", template: "Table", icon: Table2, color: "#16a34a" },
  { label: "Timeline", template: "Timeline", icon: CalendarDays, color: "#16a34a" },
  { label: "Kanban", template: "Kanban", icon: Columns3, color: "#22c55e" },
  { label: "Doc", template: "Doc", icon: FileText, color: "#0ea5e9" },
  { label: "Slides", template: "Slides", icon: Presentation, color: "#fb7185" },
  { label: "Engage activities", template: "Engage activities", icon: Gamepad2, color: "#f43f5e" },
  { label: "Talktrack", template: "Talktrack", icon: Video, color: "#14b8a6" },
  { label: "Flows", template: "Flows", icon: GitBranch, color: "#8b5cf6", isNew: true, separated: true },
];

interface FormatMenuProps {
  onSelect: (template: string) => void;
  onOpenDiagram: () => void;
}

export const FormatMenu = ({ onSelect, onOpenDiagram }: FormatMenuProps) => (
  <div className="format-menu" role="menu" aria-label="Formats and flows">
    <div className="format-menu__header">
      <p>Formats &amp; flows</p>
      <span>Insert a collaborative layout</span>
    </div>
    {formats.map(({ label, template, icon: Icon, color, isNew, separated }) => (
      <button
        key={label}
        type="button"
        role="menuitem"
        className={separated ? "format-menu__item format-menu__item--separated" : "format-menu__item"}
        onClick={() => label === "Diagram" ? onOpenDiagram() : onSelect(template)}
      >
        <Icon className="size-4" style={{ color }} aria-hidden="true" />
        <span>{label}</span>
        {isNew && <em>New</em>}
      </button>
    ))}
  </div>
);
