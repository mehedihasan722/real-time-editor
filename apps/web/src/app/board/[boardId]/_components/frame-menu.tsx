"use client";

import { File, Frame, Monitor, RectangleHorizontal, Smartphone, Tablet, Workflow } from "lucide-react";

interface FrameMenuProps {
  onSelect: (width: number, height: number, label: string) => void;
  onTemplate: (template: string) => void;
  onDiagram: () => void;
}

const frames = [
  { label: "Custom", width: 360, height: 240, icon: Frame },
  { label: "A4", width: 248, height: 350, icon: File },
  { label: "Letter", width: 264, height: 342, icon: File },
  { label: "16 : 9", width: 480, height: 270, icon: RectangleHorizontal },
  { label: "4 : 3", width: 400, height: 300, icon: RectangleHorizontal },
  { label: "1 : 1", width: 320, height: 320, icon: RectangleHorizontal },
  { label: "Mobile", width: 180, height: 360, icon: Smartphone },
  { label: "Tablet", width: 320, height: 430, icon: Tablet },
  { label: "Desktop", width: 520, height: 320, icon: Monitor },
];

export const FrameMenu = ({ onSelect, onTemplate, onDiagram }: FrameMenuProps) => (
  <div className="frame-menu" role="menu" aria-label="Frames">
    <div className="frame-menu__grid">
      {frames.map(({ label, width, height, icon: Icon }) => <button key={label} type="button" onClick={() => onSelect(width, height, label)}><Icon size={24} /><span>{label}</span></button>)}
    </div>
    <div className="frame-menu__templates">
      <button type="button" onClick={() => onTemplate("Slides")}><File size={16} />Slides</button>
      <button type="button" onClick={onDiagram}><Workflow size={16} />Diagram</button>
      <button type="button" onClick={() => onTemplate("Engage activities")}><RectangleHorizontal size={16} />Engage activities</button>
      <button type="button" onClick={() => onTemplate("Prototype")}><Smartphone size={16} />Prototype</button>
    </div>
  </div>
);
