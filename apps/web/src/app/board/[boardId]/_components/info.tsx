"use client";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import React from "react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Hint from "@/components/hint";
import { useRenameModal } from "@/store/use-rename-modal";
import Actions from "@/components/actions";
import { Menu, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InfoProps {
  boardId: string;
}


const TabSepartor = () => {
  return <div className="text-neutral-300 px-1.5">|</div>;
};

const Info = ({ boardId }: InfoProps) => {
  const { onOpen } = useRenameModal();
  const data = useQuery(api.board.get, { id: boardId as Id<"boards"> });
  const favourite = useMutation(api.board.favourite);
  const unfavourite = useMutation(api.board.unfavourite);
  const [favouritePending, setFavouritePending] = useState(false);

  if (!data) return <InfoSkeleton />;
  const toggleFavourite = async () => {
    setFavouritePending(true);
    try {
      if (data.isFavourite) {
        await unfavourite({ id: data._id });
        toast.success("Removed from favourite boards");
      } else {
        await favourite({ id: data._id, orgId: data.orgId });
        toast.success("Added to favourite boards");
      }
    } catch {
      toast.error("Could not update favourite status");
    } finally {
      setFavouritePending(false);
    }
  };
  return (
    <div className="board-top-panel absolute z-20 top-2 left-2 bg-white rounded-xl border border-slate-200/70 px-1.5 h-12 flex items-center shadow-md">
      <Hint label="Go to boards" side="bottom" sideOffset={10}>
        <Button className="px-2" variant="board" asChild>
          <Link href="/">
            <Image src="/logo.svg" alt="Flowboard Logo" height={60} width={60} className="h-8 w-auto" />
            <span
              className={cn(
                "font-semibold text-xl ml-2 text-black",
                "font-display"
              )}
            >
              Flowboard
            </span>
          </Link>
        </Button>
      </Hint>
      <TabSepartor />
      <Hint label="Edit title" side="bottom" sideOffset={10}>
        <Button
          variant="board"
          className="text-base font-normal px-2"
          onClick={() => onOpen(data._id, data.title)}
        >
          {data.title}
        </Button>
      </Hint>
      <TabSepartor />
      <Hint label={data.isFavourite ? "Remove from favourites" : "Mark as favourite"} side="bottom" sideOffset={10}>
        <Button size="icon" variant="board" disabled={favouritePending} onClick={toggleFavourite} aria-label={data.isFavourite ? "Remove from favourites" : "Mark as favourite"}>
          <Star className={data.isFavourite ? "size-4 fill-indigo-500 text-indigo-500" : "size-4"} />
        </Button>
      </Hint>
      <Actions id={data._id} title={data.title} side="bottom" sideOffset={10}>
        <div>
          <Hint label="Main menu" side="bottom" sideOffset={10}>
            <Button size="icon" variant="board" aria-label="Main menu">
              <Menu />
            </Button>
          </Hint>
        </div>
      </Actions>
    </div>
  );
};

export default Info;
export const InfoSkeleton = () => {
  return (
    <div className="board-skeleton absolute top-2 left-2 h-12 w-[320px] rounded-xl" />
  );
};
