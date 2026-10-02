"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFlowchartLayers, type FlowchartStyle } from "@/lib/flowchart-template";
import { LayerType } from "@/types/canvas";

const styles: FlowchartStyle[] = ["delivery", "linear", "decision", "swimlane", "custom"];
export function FlowchartPicker({ open, onOpenChange, onChoose }: { open: boolean; onOpenChange: (value: boolean) => void; onChoose: (style: FlowchartStyle, steps: string[]) => void }) {
  const [style, setStyle] = useState<FlowchartStyle>("delivery");
  const [steps, setSteps] = useState("Start\nPlan\nBuild\nReview\nFinish");
  const parsed = steps.split("\n").map(value => value.trim()).filter(Boolean);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-auto"><DialogHeader><DialogTitle>Choose a flowchart</DialogTitle><DialogDescription>Preview a layout, then add its editable shapes and connectors to your board.</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{styles.map(value => {
    const layers = getFlowchartLayers(value, value, parsed.length ? parsed : ["Start"]);
    const height = Math.max(...layers.map(([, layer]) => layer.y + layer.height)) + 60;
    return <button type="button" key={value} aria-pressed={style === value} onClick={() => setStyle(value)} className={`rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring ${style === value ? "border-primary bg-primary/10" : "bg-muted/20"}`}><svg aria-hidden="true" viewBox={`0 0 1260 ${height}`} className="h-36 w-full rounded-lg bg-white">{layers.map(([id, layer]) => layer.type === LayerType.Shape ? <g key={id} transform={`rotate(${layer.rotation || 0} ${layer.x + layer.width / 2} ${layer.y + layer.height / 2})`}>{layer.shape === "arrow" || layer.shape === "line" ? <path d={`M${layer.x} ${layer.y + layer.height / 2} h${layer.width} l-18 -10 m18 10 l-18 10`} fill="none" stroke="#34464c" strokeWidth="5" /> : <>{layer.shape === "diamond" ? <polygon points={`${layer.x + layer.width / 2},${layer.y} ${layer.x + layer.width},${layer.y + layer.height / 2} ${layer.x + layer.width / 2},${layer.y + layer.height} ${layer.x},${layer.y + layer.height / 2}`} fill={`rgb(${layer.fill.r},${layer.fill.g},${layer.fill.b})`} /> : <rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} rx={layer.shape === "rectangle" ? 6 : 40} fill={`rgb(${layer.fill.r},${layer.fill.g},${layer.fill.b})`} />}<text x={layer.x + layer.width / 2} y={layer.y + layer.height / 2} textAnchor="middle" fill="white" fontSize="17">{layer.value?.replace(/\n/g, " ")}</text></>}</g> : null)}</svg><span className="mt-2 block text-sm font-medium capitalize">{value === "delivery" ? "Delivery & approvals" : value}</span></button>;
  })}</div>{style === "custom" && <label className="text-sm">Steps, one per line (up to 20)<textarea className="mt-2 min-h-32 w-full rounded-lg border bg-background p-3" maxLength={2400} value={steps} onChange={event => setSteps(event.target.value)} /></label>}<Button disabled={style === "custom" && (!parsed.length || parsed.length > 20)} onClick={() => { onChoose(style, parsed); onOpenChange(false); }}>Add flowchart</Button></DialogContent></Dialog>;
}
