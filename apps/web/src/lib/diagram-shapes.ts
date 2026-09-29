import { DiagramShapeKind, LayerType, Point, ShapeLayer } from "@/types/canvas";

export const shapePackIds = ["basic", "flowchart", "connectors", "callouts", "aws", "uml", "vmware", "azure", "bpmn", "salesforce", "value-stream", "data-flow", "google-cloud", "cisco", "erd", "kubernetes"] as const;
export type ShapePackId = (typeof shapePackIds)[number];

export interface ShapeDefinition {
  id: string;
  label: string;
  kind: DiagramShapeKind;
  pack: ShapePackId;
  color?: string;
}

export const shapePacks: { id: ShapePackId; label: string; description: string; shapeCount: number; color: string }[] = [
  { id: "basic", label: "Basic shapes", description: "Everyday geometric building blocks", shapeCount: 24, color: "#17203b" },
  { id: "flowchart", label: "Flowchart", description: "Processes, decisions, data, and documents", shapeCount: 18, color: "#17205c" },
  { id: "connectors", label: "Connectors", description: "Directional arrows and transitions", shapeCount: 12, color: "#4938dc" },
  { id: "callouts", label: "Callouts", description: "Annotations and conversation markers", shapeCount: 12, color: "#db2777" },
  { id: "aws", label: "AWS", description: "Cloud architecture building blocks", shapeCount: 24, color: "#f97316" },
  { id: "uml", label: "UML", description: "Actors, systems, and software components", shapeCount: 16, color: "#17175c" },
  { id: "vmware", label: "VMware", description: "Virtual infrastructure and services", shapeCount: 18, color: "#475569" },
  { id: "azure", label: "Azure", description: "Microsoft cloud architecture", shapeCount: 18, color: "#0ea5e9" },
  { id: "bpmn", label: "BPMN", description: "Business process modeling notation", shapeCount: 12, color: "#17175c" },
  { id: "salesforce", label: "Salesforce", description: "CRM workflows and team systems", shapeCount: 12, color: "#22a6e8" },
  { id: "value-stream", label: "Value Stream Mapping", description: "Lean delivery and material flows", shapeCount: 12, color: "#17175c" },
  { id: "data-flow", label: "Data Flow", description: "Systems, stores, and data movement", shapeCount: 12, color: "#17175c" },
  { id: "google-cloud", label: "Google Cloud", description: "Google Cloud architecture", shapeCount: 18, color: "#4285f4" },
  { id: "cisco", label: "Cisco", description: "Network infrastructure diagrams", shapeCount: 18, color: "#0284c7" },
  { id: "erd", label: "ERD", description: "Entities and data-store notation", shapeCount: 12, color: "#202840" },
  { id: "kubernetes", label: "Kubernetes", description: "Container orchestration architecture", shapeCount: 12, color: "#326ce5" },
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
  { id: "aws-function", label: "Cloud function", kind: "hexagon", pack: "aws" },
  { id: "aws-network", label: "Cloud network", kind: "circle", pack: "aws" },
  { id: "uml-interface", label: "Interface", kind: "circle", pack: "uml" },
  { id: "uml-package", label: "Package", kind: "document", pack: "uml" },
  { id: "vmware-host", label: "Virtual host", kind: "server", pack: "vmware" },
  { id: "vmware-database", label: "Virtual database", kind: "database", pack: "vmware" },
  { id: "vmware-network", label: "Virtual network", kind: "cloud", pack: "vmware" },
  { id: "azure-user", label: "Azure identity", kind: "actor", pack: "azure" },
  { id: "azure-sql", label: "Azure SQL", kind: "database", pack: "azure" },
  { id: "azure-function", label: "Azure function", kind: "hexagon", pack: "azure" },
  { id: "azure-service", label: "Azure service", kind: "server", pack: "azure" },
  { id: "bpmn-task", label: "Task", kind: "rounded", pack: "bpmn" },
  { id: "bpmn-event", label: "Event", kind: "circle", pack: "bpmn" },
  { id: "bpmn-gateway", label: "Gateway", kind: "diamond", pack: "bpmn" },
  { id: "bpmn-store", label: "Data store", kind: "database", pack: "bpmn" },
  { id: "salesforce-user", label: "CRM user", kind: "actor", pack: "salesforce" },
  { id: "salesforce-team", label: "CRM team", kind: "circle", pack: "salesforce" },
  { id: "salesforce-process", label: "CRM process", kind: "rounded", pack: "salesforce" },
  { id: "salesforce-cloud", label: "Salesforce cloud", kind: "cloud", pack: "salesforce" },
  { id: "vsm-flow", label: "Material flow", kind: "arrow-right", pack: "value-stream" },
  { id: "vsm-process", label: "Process", kind: "rectangle", pack: "value-stream" },
  { id: "vsm-supplier", label: "Supplier", kind: "server", pack: "value-stream" },
  { id: "vsm-signal", label: "Signal", kind: "star", pack: "value-stream" },
  { id: "data-process", label: "Process", kind: "rounded", pack: "data-flow" },
  { id: "data-store", label: "Data store", kind: "database", pack: "data-flow" },
  { id: "data-external", label: "External system", kind: "rectangle", pack: "data-flow" },
  { id: "data-transfer", label: "Data transfer", kind: "arrow-right", pack: "data-flow" },
  { id: "gcp-service", label: "Google Cloud service", kind: "hexagon", pack: "google-cloud" },
  { id: "gcp-database", label: "Cloud database", kind: "database", pack: "google-cloud" },
  { id: "gcp-network", label: "Cloud network", kind: "cloud", pack: "google-cloud" },
  { id: "gcp-security", label: "Cloud security", kind: "diamond", pack: "google-cloud" },
  { id: "cisco-router", label: "Router", kind: "circle", pack: "cisco" },
  { id: "cisco-switch", label: "Network switch", kind: "server", pack: "cisco" },
  { id: "cisco-firewall", label: "Firewall", kind: "rectangle", pack: "cisco" },
  { id: "cisco-lock", label: "Secure network", kind: "hexagon", pack: "cisco" },
  { id: "k8s-cluster", label: "Cluster", kind: "hexagon", pack: "kubernetes" },
  { id: "k8s-service", label: "Service", kind: "circle", pack: "kubernetes" },
  { id: "k8s-workload", label: "Workload", kind: "server", pack: "kubernetes" },
  { id: "k8s-network", label: "Cluster network", kind: "cloud", pack: "kubernetes" },
];

const generatedKinds: DiagramShapeKind[] = ["rectangle", "rounded", "circle", "triangle", "diamond", "star", "arrow-right", "arrow-left", "hexagon", "database", "cloud", "plus", "document", "parallelogram", "terminator", "actor", "server", "callout"];

export function getShapesForPack(packId: ShapePackId): ShapeDefinition[] {
  const pack = shapePacks.find((item) => item.id === packId);
  if (!pack) return [];
  const curated = shapeDefinitions.filter((shape) => shape.pack === packId);
  return Array.from({ length: pack.shapeCount }, (_, index) => {
    if (curated[index]) return curated[index];
    return {
      id: `${packId}-shape-${index + 1}`,
      label: `${pack.label} shape ${index + 1}`,
      kind: generatedKinds[(index + shapePackIds.indexOf(packId)) % generatedKinds.length],
      pack: packId,
      color: pack.color,
    };
  });
}

export function createDiagramShapeLayer(kind: DiagramShapeKind, position: Point): ShapeLayer {
  const isConnector = ["line", "arrow", "elbow-arrow", "divider"].includes(kind);
  return {
    type: LayerType.Shape,
    shape: kind,
    x: position.x - 65,
    y: position.y - 45,
    width: isConnector ? 170 : 130,
    height: isConnector ? 54 : 90,
    fill: { r: 255, g: 255, b: 255, a: 1 },
  };
}
