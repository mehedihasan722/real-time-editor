import { DiagramShapeKind, LayerType, Point, ShapeLayer } from "@/types/canvas";

export type ShapePackId = "basic" | "flowchart" | "connectors" | "callouts" | "uml" | "erd" | "aws";

export interface ShapeDefinition {
  id: string;
  label: string;
  kind: DiagramShapeKind;
  pack: ShapePackId;
}

export const shapePacks: { id: ShapePackId; label: string; description: string }[] = [
  { id: "basic", label: "Basic shapes", description: "Everyday geometric building blocks" },
  { id: "flowchart", label: "Flowchart", description: "Processes, decisions, data, and documents" },
  { id: "connectors", label: "Connectors", description: "Directional arrows and transitions" },
  { id: "callouts", label: "Callouts", description: "Annotations and conversation markers" },
  { id: "uml", label: "UML", description: "Actors, systems, and software components" },
  { id: "erd", label: "ERD", description: "Entities and data-store notation" },
  { id: "aws", label: "AWS", description: "Cloud architecture building blocks" },
];

export const shapeDefinitions: ShapeDefinition[] = [
  { id: "square", label: "Square", kind: "rectangle", pack: "basic" },
  { id: "rounded", label: "Rounded rectangle", kind: "rounded", pack: "basic" },
  { id: "circle", label: "Circle", kind: "circle", pack: "basic" },
  { id: "triangle", label: "Triangle", kind: "triangle", pack: "basic" },
  { id: "diamond", label: "Diamond", kind: "diamond", pack: "basic" },
  { id: "star", label: "Star", kind: "star", pack: "basic" },
  { id: "hexagon", label: "Hexagon", kind: "hexagon", pack: "basic" },
  { id: "cloud", label: "Cloud", kind: "cloud", pack: "basic" },
  { id: "plus", label: "Plus", kind: "plus", pack: "basic" },
  { id: "process", label: "Process", kind: "rectangle", pack: "flowchart" },
  { id: "decision", label: "Decision", kind: "diamond", pack: "flowchart" },
  { id: "start-end", label: "Start or end", kind: "terminator", pack: "flowchart" },
  { id: "data", label: "Data", kind: "parallelogram", pack: "flowchart" },
  { id: "document", label: "Document", kind: "document", pack: "flowchart" },
  { id: "data-store", label: "Data store", kind: "database", pack: "flowchart" },
  { id: "right-arrow", label: "Right arrow", kind: "arrow-right", pack: "connectors" },
  { id: "left-arrow", label: "Left arrow", kind: "arrow-left", pack: "connectors" },
  { id: "callout", label: "Callout", kind: "callout", pack: "callouts" },
  { id: "actor", label: "Actor", kind: "actor", pack: "uml" },
  { id: "component", label: "Component", kind: "server", pack: "uml" },
  { id: "entity", label: "Entity", kind: "rectangle", pack: "erd" },
  { id: "erd-store", label: "Database", kind: "database", pack: "erd" },
  { id: "aws-cloud", label: "AWS cloud", kind: "cloud", pack: "aws" },
  { id: "aws-service", label: "AWS service", kind: "server", pack: "aws" },
  { id: "aws-database", label: "AWS database", kind: "database", pack: "aws" },
];

export function createDiagramShapeLayer(kind: DiagramShapeKind, position: Point): ShapeLayer {
  return {
    type: LayerType.Shape,
    shape: kind,
    x: position.x - 65,
    y: position.y - 45,
    width: 130,
    height: 90,
    fill: { r: 255, g: 255, b: 255, a: 1 },
  };
}
