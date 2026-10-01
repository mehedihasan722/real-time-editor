import { Layer, LayerType } from "@/types/canvas";

export function getRoadmapLayers(title = "Product roadmap", author = "Team"): [string, Layer][] {
  const fill = { r: 255, g: 255, b: 255, a: 1 };
  const stroke = { r: 120, g: 128, b: 113, a: 1 };
  const result: [string, Layer][] = [["template-heading", { type: LayerType.Text, x: 100, y: 60, width: 1000, height: 65, fill: { r: 30, g: 41, b: 59, a: 1 }, value: title }]];
  const edge = (id: string, x1: number, y1: number, x2: number, y2: number) => {
    const width = Math.hypot(x2 - x1, y2 - y1);
    result.push([id, { type: LayerType.Shape, shape: "arrow", x: (x1 + x2) / 2 - width / 2, y: (y1 + y2) / 2 - 12, width, height: 24, rotation: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, fill: stroke, strokeColor: stroke }]);
  };
  edge("vision-research", 430, 245, 680, 245);
  edge("research-test", 845, 355, 595, 505);
  edge("build-test", 390, 615, 430, 615);
  edge("test-launch", 595, 725, 845, 815);
  const cards = [
    ["vision", 100, 160, "Define Product Vision", "Clarify the core idea, goals, and long-term mission of the product.", "planning product discovery ux"],
    ["research", 680, 180, "Market & Competitor Research", "Study user needs and analyze competitors to find your edge.", "research analytics growth"],
    ["build", 60, 530, "Build Core Features", "Connect the essential services and implement the first product experience.", "development api frontend mvp"],
    ["test", 430, 505, "Test Core Features (MVP)", "Run functional tests to verify basic behavior and collect feedback.", "qa testing mvp bugfix"],
    ["launch", 680, 815, "Launch Beta for Early Users", "Invite a small group to test and validate the product.", "beta launch feedback"],
  ] as const;
  for (const [id, x, y, value, description, tags] of cards) result.push([id, { type: LayerType.Note, x, y, width: 330, height: 220, fill, value, description, tags, author, roadmap: true, status: "planned" }]);
  return result;
}
