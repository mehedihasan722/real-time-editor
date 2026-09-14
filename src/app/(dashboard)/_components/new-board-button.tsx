"use client";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import React from "react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewBoardButtonProps {
  orgId: string;
  disabled?: boolean;
  compact?: boolean;
}
const NewBoardButton = ({ orgId, disabled, compact = false }: NewBoardButtonProps) => {
  const router = useRouter();

  const { mutate, pending } = useApiMutation(api.board.create);

  const onClick = () => {
    mutate({
      orgId,
      title: "Untitled",
    })
      .then((id) => {
        toast.success("Board created");
        router.push(`/board/${id}`);
      })
      .catch(() => toast.error("Failed to create board"));
  };
  return (
    <button
      disabled={pending || disabled}
      onClick={onClick}
      className={cn(
        compact ? "w-full h-9 rounded-md bg-[#4262ff] hover:bg-[#3451df] text-white flex items-center justify-center gap-2 font-semibold text-sm" : "col-span-1 aspect-[4/3] bg-[#fff4c5] border-2 border-dashed border-[#e6cf74] rounded-xl hover:bg-[#ffed9b] flex flex-col items-center justify-center py-6 transition-colors",
        (pending || disabled) &&
          "opacity-75 cursor-not-allowed"
      )}
    >
      <div />
      <Plus className={compact ? "h-4 w-4" : "h-10 w-10 text-[#1c1c1c] stroke-1"} />
      <p className={compact ? "" : "text-sm text-[#1c1c1c] font-semibold mt-2"}>{compact ? "Create new" : "New Board"}</p>
    </button>
  );
};

export default NewBoardButton;
