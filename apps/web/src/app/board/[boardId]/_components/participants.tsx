"use client";

import React from "react";
import { useOthers, useSelf } from "@liveblocks/react/suspense";
import UserAvatar from "./user-avatar";
import { connectionIdToColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Hint from "@/components/hint";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

const MAX_SHOWN_USERS = 2;
const Participants = () => {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > MAX_SHOWN_USERS;

  const shareBoard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Board link copied");
    } catch {
      toast.error("Could not copy the board link");
    }
  };

  return (
    <div className="board-top-panel absolute z-20 h-12 top-2 right-2 bg-white rounded-xl p-1.5 pl-3 flex items-center gap-2 shadow-md border border-slate-200/70">
      <div className="flex gap-x-2">
        {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => {
          return (
            <UserAvatar
              borderColor={connectionIdToColor(connectionId)}
              key={connectionId}
              src={info?.picture}
              name={info?.name}
              fallback={info?.name?.[0] || "T"}
            />
          );
        })}
        {currentUser && (
          <UserAvatar
            borderColor={connectionIdToColor(currentUser.connectionId)}
            src={currentUser.info?.picture}
            name={`${currentUser.info?.name} (You)`}
            fallback={currentUser.info?.name?.[0]}
          />
        )}

        {hasMoreUsers && (
          <UserAvatar
            name={`${users.length - MAX_SHOWN_USERS} more`}
            fallback={`+${users.length - MAX_SHOWN_USERS}`}
          />
        )}
      </div>
      <ThemeToggle />
      <Hint label="Copy board link" side="bottom">
        <Button className="h-9 gap-2 bg-indigo-600 px-3 text-white hover:bg-indigo-500" onClick={shareBoard}>
          <Share2 className="size-4" /> <span className="hidden sm:inline">Share</span>
        </Button>
      </Hint>
    </div>
  );
};

export default Participants;

export const ParticipantsSkeleton = () => {
  return (
    <div className="board-skeleton absolute h-12 top-2 right-2 w-[170px] rounded-xl" />
  );
};
