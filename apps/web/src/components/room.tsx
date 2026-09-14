"use client";

import React, { ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Layer } from "@/types/canvas";
import { getTemplateLayers } from "@/lib/board-templates";
import { client } from "../../liveblocks.config";

// Create the room context
const { RoomProvider } = createRoomContext(client);

interface RoomProps {
  children: ReactNode;
  roomId: string;
  template?: string;
  fallback: NonNullable<ReactNode> | null;
}
// https://cosmic-shrimp-7.accounts.dev/
const Room = ({ children, roomId, template, fallback }: RoomProps) => {
  const templateLayers = getTemplateLayers(template);
  return (
    <LiveblocksProvider throttle={16} authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          selection: [],
          pencilDraft: null,
          penColor: null,
        }}
        initialStorage={{
          layers: new LiveMap<string, LiveObject<Layer>>(templateLayers.map(([id, layer]) => [id, new LiveObject(layer)])),
          layerIds: new LiveList(templateLayers.map(([id]) => id)),
        }}
      >
        <ClientSideSuspense fallback={fallback}> {children}</ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};

export default Room;
