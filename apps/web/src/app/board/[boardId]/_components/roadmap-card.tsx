"use client";
import { useMutation } from "@liveblocks/react";
import { NoteLayer } from "@/types/canvas";
import { Trash2 } from "lucide-react";

export function RoadmapCard({ id, layer, onPointerDown, selected }: { id: string; layer: NoteLayer; onPointerDown: (event: React.PointerEvent, id: string) => void; selected: boolean }) {
  const update = useMutation(({ storage }, patch: Partial<NoteLayer>) => { storage.get("layers").get(id)?.update(patch); }, [id]);
  const remove = useMutation(({ storage }) => { storage.get("layers").delete(id); const ids = storage.get("layerIds"); const index = ids.indexOf(id); if (index >= 0) ids.delete(index); }, [id]);
  return <foreignObject x={layer.x} y={layer.y} width={layer.width} height={layer.height} onPointerDown={event => { if (!(event.target as Element).closest("input,textarea,select,button")) onPointerDown(event, id); }}>
    <article className={`flex h-full flex-col gap-2 rounded-2xl border bg-background p-4 font-sans text-foreground shadow-sm ${selected ? "border-lime-500 ring-4 ring-inset ring-lime-400" : "border-border"}`}>
      <div className="flex gap-2"><input aria-label="Milestone title" defaultValue={layer.value} key={layer.value} maxLength={120} onBlur={event => { if (event.target.value.trim()) update({ value: event.target.value.trim() }); }} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none focus:ring-2 focus:ring-lime-500" /><button aria-label="Delete milestone" onClick={() => remove()}><Trash2 size={14} /></button></div>
      <input aria-label="Milestone tags" defaultValue={layer.tags} key={`tags-${layer.tags}`} maxLength={200} onBlur={event => update({ tags: event.target.value })} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-lime-500" />
      <textarea aria-label="Milestone description" defaultValue={layer.description} key={`description-${layer.description}`} maxLength={2000} onBlur={event => update({ description: event.target.value })} className="min-h-0 flex-1 resize-none bg-transparent text-xs leading-5 text-muted-foreground outline-none focus:ring-2 focus:ring-lime-500" />
      <footer className="flex items-center justify-between gap-2"><select aria-label="Milestone status" value={layer.status || "planned"} onChange={event => update({ status: event.target.value as NoteLayer["status"] })} className={`rounded border bg-background p-1 text-xs ${layer.status === "done" ? "text-green-700 dark:text-green-300" : layer.status === "in-progress" ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"}`}><option value="planned">PLANNED</option><option value="in-progress">IN WORK</option><option value="done">DONE</option></select><span className="max-w-28 truncate rounded-full bg-muted px-2 py-1 text-xs" title={layer.author}>{layer.author || "Team"}</span></footer>
    </article>
  </foreignObject>;
}
