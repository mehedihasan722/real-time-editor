import { Layer, LayerType, ShapeLayer } from "@/types/canvas";

export type FlowchartStyle = "delivery" | "linear" | "decision" | "swimlane" | "custom";
export function getFlowchartLayers(title = "Product delivery flow", style: FlowchartStyle = "delivery", steps: string[] = []): [string, Layer][] {
  if (style !== "delivery") return getStyledFlowchart(title, style, steps);
  const charcoal = { r: 52, g: 70, b: 76, a: 1 };
  const purple = { r: 70, g: 64, b: 180, a: 1 };
  const green = { r: 38, g: 133, b: 65, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const layers: [string, Layer][] = [
    ["flow-paper", { type: LayerType.Rectangle, x: 60, y: 70, width: 1200, height: 1200, fill: white }],
    ["template-heading", { type: LayerType.Text, x: 170, y: 95, width: 970, height: 65, fill: charcoal, value: title }],
  ];
  const node = (id: string, shape: ShapeLayer["shape"], x: number, y: number, width: number, height: number, value: string, fill = charcoal) => layers.push([id, { type: LayerType.Shape, shape, x, y, width, height, value, fill, strokeColor: fill, strokeWidth: 2 }]);
  const edge = (id: string, x1: number, y1: number, x2: number, y2: number, arrow = true) => {
    const width = Math.hypot(x2 - x1, y2 - y1);
    layers.push([id, { type: LayerType.Shape, shape: arrow ? "arrow" : "line", x: (x1 + x2) / 2 - width / 2, y: (y1 + y2) / 2 - 12, width, height: 24, rotation: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, fill: charcoal, strokeColor: charcoal, strokeWidth: 2 }]);
  };
  // Connectors precede nodes so their ends sit cleanly behind the process shapes.
  edge("start-workshop", 650, 275, 650, 330);
  edge("workshop-scope", 650, 420, 650, 475);
  edge("scope-finalize", 650, 625, 650, 705);
  edge("scope-revise", 760, 550, 940, 550);
  edge("revise-up", 1040, 505, 1040, 375, false);
  edge("revise-workshop", 1040, 375, 770, 375);
  edge("finalize-approval", 650, 795, 650, 850);
  edge("approval-done", 650, 1000, 650, 1100);
  edge("approval-feedback", 540, 925, 360, 925);
  edge("feedback-up", 260, 880, 260, 375, false);
  edge("feedback-workshop", 260, 375, 530, 375);
  node("start", "circle", 595, 165, 110, 110, "SPRINT\nSTART");
  node("workshop", "rectangle", 530, 330, 240, 90, "DISCOVERY\nWORKSHOP");
  node("scope", "diamond", 540, 475, 220, 150, "IS THE SCOPE\nCOMPLETE?", purple);
  node("revise", "rectangle", 940, 505, 200, 90, "REFINE\nREQUIREMENTS");
  node("finalize", "rectangle", 530, 705, 240, 90, "FINALIZE\nTHE PLAN");
  node("approval", "diamond", 540, 850, 220, 150, "CLIENT\nAPPROVAL?", green);
  node("feedback", "rectangle", 160, 880, 200, 90, "REVIEW\nFEEDBACK");
  node("done", "terminator", 550, 1100, 200, 75, "READY TO DELIVER", green);
  node("scope-yes", "rectangle", 665, 650, 65, 30, "YES");
  node("scope-no", "rectangle", 805, 535, 65, 30, "NO");
  node("approval-yes", "rectangle", 665, 1030, 65, 30, "YES");
  node("approval-no", "rectangle", 435, 910, 65, 30, "NO");
  node("input", "document", 885, 710, 280, 130, "INPUT\nDraft scope · Research\nStakeholder feedback", white);
  layers[layers.length - 1][1] = { ...layers[layers.length - 1][1], strokeColor: charcoal } as ShapeLayer;
  return layers;
}

function getStyledFlowchart(title: string, style: FlowchartStyle, steps: string[]): [string, Layer][] {
  const ink = { r: 52, g: 70, b: 76, a: 1 };
  const accent = { r: 80, g: 75, b: 190, a: 1 };
  const labels = (style === "custom" ? steps : style === "linear" ? ["Start", "Research", "Design", "Build", "Review", "Launch"] : style === "swimlane" ? ["Product · Define scope", "Design · Prototype", "Engineering · Implement", "QA · Validate", "Product · Release"] : ["Start", "Evaluate request", "Approved?", "Deliver", "Revise"]).map(value => value.trim().slice(0, 120)).filter(Boolean).slice(0, 20);
  if (!labels.length) throw new Error("Add at least one flowchart step.");
  const nodes: [string, Layer][] = labels.map((value, index) => {
    const x = style === "swimlane" ? 160 + index % 3 * 320 : style === "decision" && index === 4 ? 850 : 450;
    const y = style === "decision" && index === 4 ? 540 : 180 + index * 180;
    return ["node-" + index, { type: LayerType.Shape, shape: style === "decision" && index === 2 ? "diamond" : index === 0 || index === labels.length - 1 ? "terminator" : "rectangle", x, y, width: 260, height: 100, value, fill: index === 2 ? accent : ink, strokeColor: ink, strokeWidth: 2 }];
  });
  const edges: [string, Layer][] = nodes.slice(1).map(([, target], index) => {
    const source = nodes[index][1];
    const x1 = source.x + source.width / 2, y1 = source.y + source.height;
    const x2 = target.x + target.width / 2, y2 = target.y;
    const width = Math.hypot(x2 - x1, y2 - y1);
    return ["edge-" + index, { type: LayerType.Shape, shape: "arrow", x: (x1 + x2) / 2 - width / 2, y: (y1 + y2) / 2 - 12, width, height: 24, rotation: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, fill: ink, strokeColor: ink, strokeWidth: 2 }];
  });
  if (style === "decision") {
    edges.pop();
    edges.push(["branch", { type: LayerType.Shape, shape: "arrow", x: 710, y: 578, width: 140, height: 24, fill: ink, strokeColor: ink, strokeWidth: 2 }]);
  }
  const lanes: [string, Layer][] = style === "swimlane" ? ["Product", "Design", "Engineering"].flatMap((value, index): [string, Layer][] => [
    ["lane-" + index, { type: LayerType.Rectangle, x: 140 + index * 320, y: 140, width: 300, height: 1100, fill: { r: 239 - index * 4, g: 241 - index * 4, b: 248, a: 1 } }],
    ["lane-label-" + index, { type: LayerType.Text, x: 160 + index * 320, y: 145, width: 260, height: 30, fill: ink, value }],
  ]) : [];
  return [...lanes, ["heading", { type: LayerType.Text, x: 150, y: 65, width: 1000, height: 70, fill: ink, value: title }], ...edges, ...nodes];
}
