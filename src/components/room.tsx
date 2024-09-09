"use client";

import React, { ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { Layer } from "@/types/canvas";
import { client } from "../../liveblocks.config";

// Create Liveblocks client
/*const client = createClient({
  publicApiKey:
    "pk_dev_Rdrmb8kwkIaaXOKdSw14PrzvREhVjaocAv4bYrQNP59lCZ73i6is1E8fF90hIxys",
});*/

// Create the room context
const { RoomProvider, useMyPresence, useOthers } = createRoomContext(client);

interface RoomProps {
  children: ReactNode;
  roomId: string;
  fallback: NonNullable<ReactNode> | null;
}
// https://cosmic-shrimp-7.accounts.dev/
const Room = ({ children, roomId, fallback }: RoomProps) => {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, selection: [] }}
        initialStorage={{
          layers: new LiveMap<string, LiveObject<Layer>>(),
          layerIds: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={fallback}>
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};

export default Room;
