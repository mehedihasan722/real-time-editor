"use client";
import { createClient, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { VectorLayer, VectorPoint } from "./types";

export type VectorPresence = { cursor: VectorPoint | null; selection: string[]; dragging: string[] };
export type VectorStorage = { layers: LiveMap<string, LiveObject<VectorLayer>> };
const client = createClient({ authEndpoint: "/api/liveblocks-auth", throttle: 30 });
export const { RoomProvider, useMyPresence, useOthers, useMutation, useStorage, useSelf, useStatus, useRoom, useErrorListener } =
  createRoomContext<VectorPresence, VectorStorage, { id: string; info: { name: string; picture: string } }>(client);
