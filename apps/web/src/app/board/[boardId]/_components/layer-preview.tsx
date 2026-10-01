"use client";
import { LayerType } from "@/types/canvas";
import { useStorage } from "@liveblocks/react/suspense";
import React, { memo } from "react";
import Rectangle from "./rectangle";
import Path from "./path";
import { colorToCss } from "@/lib/utils";
import Note from "./note";
import Text from "./text";
import Ellipse from "./ellipse";
import DiagramShape from "./diagram-shape";
import StickerLayerView from "./sticker-layer";
import { RoadmapCard } from "./roadmap-card";

interface LayerPreviewProps {
  id: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor: string;
}

const LayerPreview = memo(
  ({ id, onLayerPointerDown, selectionColor }: LayerPreviewProps) => {
    const layer = useStorage((root) => root.layers[id]);

    if (!layer) {
      return null;
    }

    switch (layer.type) {
      case LayerType.Image:
        return <g onPointerDown={event => onLayerPointerDown(event, id)}><image href={layer.src} x={layer.x} y={layer.y} width={layer.width} height={layer.height} preserveAspectRatio="xMidYMid meet"><title>{layer.alt}</title></image>{selectionColor && <rect x={layer.x} y={layer.y} width={layer.width} height={layer.height} fill="none" stroke={selectionColor} />}</g>;
      case LayerType.Sticker:
        return <StickerLayerView id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor} />;
      case LayerType.Shape:
        return <DiagramShape id={id} layer={layer} onPointerDown={onLayerPointerDown} selectionColor={selectionColor} />;
      case LayerType.Path:
        return (
          <Path
            key={id}
            points={layer.points}
            onPointerDown={(e) => onLayerPointerDown(e, id)}
            x={layer.x}
            y={layer.y}
            fill={layer.fill ? colorToCss(layer.fill) : "rgba(0,0,0,1)"}
            stroke={selectionColor}
            strokeWidth={layer.strokeWidth}
            drawingTool={layer.drawingTool}
          />
        );
      case LayerType.Note:
        if (layer.roadmap) return <RoadmapCard id={id} layer={layer} onPointerDown={onLayerPointerDown} selected={!!selectionColor} />;
        return (
          <Note
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Text:
        return (
          <Text
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Ellipse:
        return (
          <Ellipse
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Rectangle:
        return (
          <Rectangle
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      default:
        return null;
    }
  }
);

LayerPreview.displayName = "LayerPreview";
export default LayerPreview;
