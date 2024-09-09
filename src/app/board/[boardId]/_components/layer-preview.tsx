"use client";
import React, { memo } from "react";

interface LayerPreviewProps {
  id: string;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

const LayerPreview = memo(
  ({ id, onLayerPointerDown, selectionColor }: LayerPreviewProps) => {
    return <div>LayerPreview</div>;
  }
);

LayerPreview.displayName = "LayerPreview";

export default LayerPreview;
