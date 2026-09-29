"use client";

import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Focus, HelpCircle, Minus, Plus } from "lucide-react";

interface BoardControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const BoardControls = ({ zoom, onZoomIn, onZoomOut, onReset }: BoardControlsProps) => (
  <div className="board-controls" aria-label="Board view controls">
    <Hint label="Reset view" side="top">
      <Button variant="board" size="icon" onClick={onReset} aria-label="Reset view">
        <Focus className="size-4" />
      </Button>
    </Hint>
    <span className="board-controls__divider" />
    <Hint label="Zoom out" side="top">
      <Button variant="board" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <Minus className="size-4" />
      </Button>
    </Hint>
    <button className="board-controls__zoom" onClick={onReset} aria-label="Reset zoom to 100 percent">
      {Math.round(zoom * 100)}%
    </button>
    <Hint label="Zoom in" side="top">
      <Button variant="board" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <Plus className="size-4" />
      </Button>
    </Hint>
    <span className="board-controls__divider" />
    <Hint label="Board help" side="top">
      <Button variant="board" size="icon" asChild>
        <a href="/guide" target="_blank" rel="noreferrer" aria-label="Open board guide">
          <HelpCircle className="size-4" />
        </a>
      </Button>
    </Hint>
  </div>
);
