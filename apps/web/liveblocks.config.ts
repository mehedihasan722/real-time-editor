import { Color, DrawingTool, Layer } from "@/types/canvas";
import { resolveCommentUsers, resolveCommentMentions } from "@/lib/comment-users";
import {
  createClient,
  LiveList,
  LiveMap,
  LiveObject,
} from "@liveblocks/client";

export const client = createClient({
  throttle: 16,
  authEndpoint: "/api/liveblocks-auth",
  resolveUsers: resolveCommentUsers,
  resolveMentionSuggestions: resolveCommentMentions,
});

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Example, real-time cursor coordinates
      cursor: { x: number; y: number } | null;
      selection: string[];
      pencilDraft: [x: number, y: number, pressure: number][] | null;
      penColor: Color | null;
      penWidth: number;
      penTool: DrawingTool;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      workspace: "retrospective" | "playground" | "todo" | "flowchart" | "roadmap" | "weekly" | null;
      layers: LiveMap<string, LiveObject<Layer>>;
      layerIds: LiveList<string>;
      // Example, a conflict-free list
      // animals: LiveList<string>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id?: string;
      info?: {
        name?: string;
        picture?: string;
        avatar?: string;
        // Example properties, for useSelf, useUser, useOthers, etc.
        // name: string;
        // avatar: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};
    // Example has two events, using a union
    // | { type: "PLAY" }
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      x?: number;
      y?: number;
      color?: string;
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export {};
