import { Layer, LayerType } from "@/types/canvas";

const palette = [
  { r: 255, g: 229, b: 114, a: 1 },
  { r: 181, g: 216, b: 255, a: 1 },
  { r: 199, g: 239, b: 210, a: 1 },
  { r: 255, g: 202, b: 202, a: 1 },
];

const content: Record<string, { heading: string; notes: string[] }> = {
  "AI Playground": { heading: "AI Playground", notes: ["What problem are we solving?", "Ideas and prompts", "Promising directions"] },
  Retrospective: { heading: "Team retrospective", notes: ["What went well?", "What could improve?", "Next actions"] },
  Flowchart: { heading: "Process flow", notes: ["Start", "Decision", "Outcome"] },
  "To-do planning": { heading: "To-do planning", notes: ["To do", "In progress", "Done"] },
  Roadmap: { heading: "Product roadmap", notes: ["Now", "Next", "Later"] },
  "Weekly update": { heading: "Weekly update", notes: ["Highlights", "Priorities", "Blockers"] },
  Prototype: { heading: "Prototype", notes: ["User need", "Screen ideas", "Feedback"] },
  "Product requirements": { heading: "Product requirements", notes: ["Problem", "Requirements", "Success criteria"] },
};

export function getTemplateLayers(template?: string): [string, Layer][] {
  const selected = template && content[template];
  if (!selected) return [];
  const heading: Layer = { type: LayerType.Text, x: 190, y: 110, width: 600, height: 80, fill: { r: 30, g: 41, b: 59, a: 1 }, value: selected.heading };
  const notes: [string, Layer][] = selected.notes.map((value, index) => [`template-note-${index}`, { type: LayerType.Note, x: 190 + index * 250, y: 240, width: 210, height: 180, fill: palette[index], value }]);
  return [["template-heading", heading], ...notes];
}
