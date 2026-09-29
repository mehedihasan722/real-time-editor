"use client";

import { FormEvent, useState } from "react";
import {
  ArrowUp,
  Bot,
  LayoutGrid,
  Map,
  Network,
  Sparkles,
  X,
} from "lucide-react";

const suggestions = [
  { label: "Brainstorm ideas", template: "AI Playground" },
  { label: "Map user journey", template: "Flowchart" },
  { label: "Plan roadmap", template: "Roadmap" },
  { label: "Create research plan", template: "Product requirements" },
];

interface BoardStarterProps {
  name?: string;
  onClose: () => void;
  onStart: (template: string) => void;
}

export const BoardStarter = ({ name, onClose, onStart }: BoardStarterProps) => {
  const [prompt, setPrompt] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = prompt.toLowerCase();
    const template = value.includes("roadmap")
      ? "Roadmap"
      : value.includes("flow") || value.includes("journey")
        ? "Flowchart"
        : value.includes("research") || value.includes("requirement")
          ? "Product requirements"
          : "AI Playground";
    onStart(template);
  };

  return (
    <section className="board-starter" aria-labelledby="board-starter-title">
      <button className="board-starter__close" onClick={onClose} aria-label="Close starter">
        <X className="size-4" />
      </button>
      <div className="board-starter__title-row">
        <span><Sparkles className="size-5" /></span>
        <div>
          <p>FLOWBOARD ASSIST</p>
          <h1 id="board-starter-title">Hey {name?.split(" ")[0] || "there"}, what are we working on?</h1>
        </div>
      </div>
      <form className="board-starter__composer" onSubmit={submit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe what you want to create..."
          aria-label="Describe your board"
        />
        <div>
          <span><Bot className="size-4" /> Guided workspace generator</span>
          <button type="submit" aria-label="Create workspace from prompt">
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
      <div className="board-starter__suggestions" aria-label="Starter suggestions">
        {suggestions.map((suggestion) => (
          <button key={suggestion.label} onClick={() => onStart(suggestion.template)}>
            {suggestion.label}
          </button>
        ))}
      </div>
      <div className="board-starter__modes">
        <span><Network className="size-4" /> Map a flow</span>
        <span><LayoutGrid className="size-4" /> Organize ideas</span>
        <span><Map className="size-4" /> Plan together</span>
      </div>
    </section>
  );
};
