import { z } from "zod";
import { LayerType, type Layer } from "@/types/canvas";

export const assistRequestSchema = z.object({
  boardId: z.string().min(1).max(128),
  mode: z.enum(["chat", "generate"]),
  stream: z.boolean().optional(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) })).min(1).max(20),
});
export const generatedBoardSchema = z.object({ title: z.string().trim().min(1).max(120), notes: z.array(z.string().trim().min(1).max(1000)).min(1).max(40) });

export function parseGeneratedBoard(content: string) {
  return generatedBoardSchema.parse(JSON.parse(content.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, "")));
}

export function generatedBoardLayers(board: z.infer<typeof generatedBoardSchema>): Layer[] {
  return [
    { type: LayerType.Text, x: 0, y: 0, width: 900, height: 80, fill: { r: 30, g: 41, b: 59, a: 1 }, value: board.title },
    ...board.notes.map((value, index): Layer => ({ type: LayerType.Note, x: (index % 4) * 240, y: 100 + Math.floor(index / 4) * 220, width: 220, height: 200, fill: { r: 255, g: 229, b: 114, a: 1 }, value, author: "Flowboard Assist" })),
  ];
}
