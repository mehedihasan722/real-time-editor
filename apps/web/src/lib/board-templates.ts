import { Layer, LayerType } from "@/types/canvas";
import { z } from "zod";

export const assistPromptSchema = z.string().trim().min(3, "Describe what you want to create.").max(280, "Keep the prompt under 280 characters.");

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
  Diagram: { heading: "Diagram", notes: ["Starting point", "Decision", "Outcome"] },
  Table: { heading: "Team table", notes: ["Items and owners", "Status and due dates", "Notes and decisions"] },
  Timeline: { heading: "Project timeline", notes: ["Now", "Up next", "Later"] },
  Kanban: { heading: "Kanban board", notes: ["To do", "In progress", "Done"] },
  Doc: { heading: "Collaborative document", notes: ["Context", "Key details", "Next steps"] },
  Slides: { heading: "Story deck", notes: ["Opening", "Core message", "Call to action"] },
  "Engage activities": { heading: "Team activity", notes: ["Warm-up", "Collaborate", "Reflect"] },
  Talktrack: { heading: "Talktrack", notes: ["Introduction", "Demo moments", "Wrap-up"] },
  Flows: { heading: "Connected flow", notes: ["Trigger", "Process", "Result"] },
  "Product requirements": { heading: "Product requirements", notes: ["Problem", "Requirements", "Success criteria"] },
};

const escapeMarkup = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function getTemplateLayers(template?: string, prompt?: string, author = "Flowboard Assist"): [string, Layer][] {
  const selected = template && content[template];
  if (!selected) return [];
  const parsedPrompt = prompt ? assistPromptSchema.safeParse(prompt) : null;
  const request = parsedPrompt?.success ? parsedPrompt.data : "";
  const safeRequest = escapeMarkup(request);
  const headingValue = request
    ? escapeMarkup(request.length > 68 ? `${request.slice(0, 65)}…` : request)
    : selected.heading;
  const generatedNotes = safeRequest
    ? [
        `Goal: ${safeRequest}`,
        selected.notes[1] || "Key ideas and decisions",
        selected.notes[2] || "Owners and next actions",
      ]
    : selected.notes;
  const heading: Layer = { type: LayerType.Text, x: 190, y: 110, width: 720, height: 80, fill: { r: 30, g: 41, b: 59, a: 1 }, value: headingValue };
  const notes: [string, Layer][] = generatedNotes.map((value, index) => [`template-note-${index}`, { type: LayerType.Note, x: 190 + index * 250, y: 240, width: 210, height: 180, fill: palette[index], value, author }]);
  return [["template-heading", heading], ...notes];
}
