import { colorToCss } from "@/lib/utils";
import { ShapeLayer } from "@/types/canvas";
import React, { useEffect, useRef } from "react";
import { useMutation } from "@liveblocks/react";

interface DiagramShapeProps {
  id: string;
  layer: ShapeLayer;
  onPointerDown: (event: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const starPoints = (width: number, height: number) =>
  Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 === 0 ? 0.48 : 0.22;
    return `${width / 2 + Math.cos(angle) * width * radius},${height / 2 + Math.sin(angle) * height * radius}`;
  }).join(" ");

const DiagramShape = ({ id, layer, onPointerDown, selectionColor }: DiagramShapeProps) => {
  const { width: w, height: h, shape } = layer;
  const fill = colorToCss(layer.fill);
  const stroke = selectionColor || (layer.strokeColor ? colorToCss(layer.strokeColor) : "#202840");
  const common = { fill, stroke, strokeWidth: selectionColor ? 3 : (layer.strokeWidth ?? 2), vectorEffect: "non-scaling-stroke" as const };
  const editor = useRef<HTMLDivElement>(null);
  const connector = ["line", "arrow", "elbow-arrow", "divider"].includes(shape);
  const updateValue = useMutation(({ storage }, value: string) => { storage.get("layers").get(id)?.set("value", value.slice(0, 2000)); }, [id]);
  useEffect(() => { if (editor.current && document.activeElement !== editor.current) editor.current.textContent = layer.value || ""; }, [layer.value]);
  const luminance = (0.2126 * layer.fill.r + 0.7152 * layer.fill.g + 0.0722 * layer.fill.b) / 255;
  const labelColor = luminance > .6 ? "#17202a" : "#ffffff";

  const content = (() => {
    switch (shape) {
      case "line": return <line x1={4} y1={h / 2} x2={w - 4} y2={h / 2} fill="none" stroke={stroke} strokeWidth={layer.strokeWidth ?? 3} vectorEffect="non-scaling-stroke" />;
      case "divider": return <line x1={4} y1={h / 2} x2={w - 4} y2={h / 2} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray="8 5" vectorEffect="non-scaling-stroke" />;
      case "arrow": return <><line x1={4} y1={h / 2} x2={w - 16} y2={h / 2} fill="none" stroke={stroke} strokeWidth={3} vectorEffect="non-scaling-stroke" /><path d={`M${w - 22} ${h / 2 - 8} L${w - 5} ${h / 2} L${w - 22} ${h / 2 + 8}`} fill="none" stroke={stroke} strokeWidth={3} /></>;
      case "elbow-arrow": return <><path d={`M4 ${h - 6} V${h * .3} H${w - 16}`} fill="none" stroke={stroke} strokeWidth={3} vectorEffect="non-scaling-stroke" /><path d={`M${w - 22} ${h * .3 - 8} L${w - 5} ${h * .3} L${w - 22} ${h * .3 + 8}`} fill="none" stroke={stroke} strokeWidth={3} /></>;
      case "block-arrow": return <polygon points={`3,${h * .35} ${w * .64},${h * .35} ${w * .64},${h * .15} ${w - 3},${h / 2} ${w * .64},${h * .85} ${w * .64},${h * .65} 3,${h * .65}`} {...common} />;
      case "circle": return <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 3} ry={h / 2 - 3} {...common} />;
      case "triangle": return <polygon points={`${w / 2},3 ${w - 3},${h - 3} 3,${h - 3}`} {...common} />;
      case "diamond": return <polygon points={`${w / 2},3 ${w - 3},${h / 2} ${w / 2},${h - 3} 3,${h / 2}`} {...common} />;
      case "star": return <polygon points={starPoints(w, h)} {...common} />;
      case "hexagon": return <polygon points={`${w * .25},3 ${w * .75},3 ${w - 3},${h / 2} ${w * .75},${h - 3} ${w * .25},${h - 3} 3,${h / 2}`} {...common} />;
      case "arrow-right": return <polygon points={`3,${h * .28} ${w * .58},${h * .28} ${w * .58},3 ${w - 3},${h / 2} ${w * .58},${h - 3} ${w * .58},${h * .72} 3,${h * .72}`} {...common} />;
      case "arrow-left": return <polygon points={`${w - 3},${h * .28} ${w * .42},${h * .28} ${w * .42},3 3,${h / 2} ${w * .42},${h - 3} ${w * .42},${h * .72} ${w - 3},${h * .72}`} {...common} />;
      case "parallelogram": return <polygon points={`${w * .18},3 ${w - 3},3 ${w * .82},${h - 3} 3,${h - 3}`} {...common} />;
      case "plus": return <polygon points={`${w * .36},3 ${w * .64},3 ${w * .64},${h * .35} ${w - 3},${h * .35} ${w - 3},${h * .65} ${w * .64},${h * .65} ${w * .64},${h - 3} ${w * .36},${h - 3} ${w * .36},${h * .65} 3,${h * .65} 3,${h * .35} ${w * .36},${h * .35}`} {...common} />;
      case "document": return <path d={`M3 3 H${w - 3} V${h * .75} Q${w * .75} ${h * .6} ${w * .5} ${h * .78} Q${w * .25} ${h * .95} 3 ${h * .78} Z`} {...common} />;
      case "database": return <><path d={`M3 ${h * .18} C3 1 ${w - 3} 1 ${w - 3} ${h * .18} V${h * .82} C${w - 3} ${h - 1} 3 ${h - 1} 3 ${h * .82} Z`} {...common} /><ellipse cx={w / 2} cy={h * .18} rx={w / 2 - 3} ry={h * .15} {...common} /></>;
      case "cloud": return <path d={`M${w * .22} ${h * .78} C2 ${h * .78} 2 ${h * .42} ${w * .24} ${h * .42} C${w * .3} 2 ${w * .63} 2 ${w * .7} ${h * .32} C${w - 2} ${h * .28} ${w - 2} ${h * .78} ${w * .78} ${h * .78} Z`} {...common} />;
      case "actor": return <><circle cx={w / 2} cy={h * .18} r={h * .13} {...common} /><path d={`M${w / 2} ${h * .31} V${h * .68} M${w * .28} ${h * .43} H${w * .72} M${w / 2} ${h * .68} L${w * .3} ${h - 3} M${w / 2} ${h * .68} L${w * .7} ${h - 3}`} fill="none" stroke={stroke} strokeWidth={3} /></>;
      case "server": return <><rect x={3} y={3} width={w - 6} height={h - 6} rx={5} {...common} /><path d={`M3 ${h * .35} H${w - 3} M3 ${h * .68} H${w - 3}`} fill="none" stroke={stroke} strokeWidth={2} /><circle cx={w * .12} cy={h * .19} r={3} fill={stroke} /><circle cx={w * .12} cy={h * .52} r={3} fill={stroke} /></>;
      case "callout": return <path d={`M3 3 H${w - 3} V${h * .72} H${w * .42} L${w * .25} ${h - 3} L${w * .28} ${h * .72} H3 Z`} {...common} />;
      case "terminator": return <rect x={3} y={3} width={w - 6} height={h - 6} rx={h / 2} {...common} />;
      case "rounded": return <rect x={3} y={3} width={w - 6} height={h - 6} rx={14} {...common} />;
      default: return <rect x={3} y={3} width={w - 6} height={h - 6} {...common} />;
    }
  })();

  return <g transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation || 0} ${w / 2} ${h / 2})`} onPointerDown={(event) => onPointerDown(event, id)} className="drop-shadow-sm">{content}{connector ? layer.value && <text x={4} y={-7} fill={stroke} fontSize={12} fontWeight={700}>{layer.value}</text> : <foreignObject x={shape === "diamond" ? w * .22 : 10} y={shape === "diamond" ? h * .22 : 8} width={shape === "diamond" ? w * .56 : w - 20} height={shape === "diamond" ? h * .56 : h - 16}><div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Shape label" onInput={event => updateValue(event.currentTarget.textContent || "")} onPaste={event => { event.preventDefault(); document.execCommand("insertText", false, event.clipboardData.getData("text/plain")); }} className="flex h-full w-full items-center justify-center whitespace-pre-wrap break-words text-center font-sans font-semibold outline-none focus:ring-2 focus:ring-blue-400" style={{ color: labelColor, fontSize: Math.max(10, Math.min(16, h * .2)) }} /></foreignObject>}</g>;
};

export default DiagramShape;
