"use client";

import React, { ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider } from "@liveblocks/react";
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create Liveblocks client
const client = createClient({
  publicApiKey:
    "pk_dev_Rdrmb8kwkIaaXOKdSw14PrzvREhVjaocAv4bYrQNP59lCZ73i6is1E8fF90hIxys",
});

// Create the room context
const { RoomProvider, useMyPresence, useOthers } = createRoomContext(client);

interface RoomProps {
  children: ReactNode;
  roomId: string;
  fallback: NonNullable<ReactNode> | null;
}

const Room = ({ children, roomId, fallback }: RoomProps) => {
  return (
    <LiveblocksProvider authEndpoint="https://cosmic-shrimp-7.accounts.dev/">
      <RoomProvider id={roomId} initialPresence={{}}>
        <ClientSideSuspense fallback={fallback}>
          {/* You can add more logic inside here */}
          {() => children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};

export default Room;
