import { StickerLayer } from "@/types/canvas";
import React from "react";

interface StickerLayerProps {
  id: string;
  layer: StickerLayer;
  onPointerDown: (event: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const StickerLayerView = ({ id, layer, onPointerDown, selectionColor }: StickerLayerProps) => (
  <foreignObject x={layer.x} y={layer.y} width={layer.width} height={layer.height} onPointerDown={(event) => onPointerDown(event, id)} style={{ overflow: "visible" }}>
    <div
      className="canvas-sticker"
      style={{
        outlineColor: selectionColor,
        fontSize: Math.max(24, Math.min(layer.width, layer.height) * 0.72),
      }}
      aria-label="Sticker"
    >
      {layer.value}
    </div>
  </foreignObject>
);

export default StickerLayerView;
