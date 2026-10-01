"use client";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import React, { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "../../convex/_generated/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useRenameModal } from "@/store/use-rename-modal";
import { usePathname, useRouter } from "next/navigation";

interface ActionsProps {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  id: string;
  title: string;
}

const Actions = ({ children, side, sideOffset, id, title }: ActionsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { onOpen } = useRenameModal();
  const { mutate, pending } = useApiMutation(api.board.remove);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(true);

  const onCopyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(`${window.location.origin}/board/${id}`);
      toast.success("Link copied");
    } catch { toast.error("Failed to copy link. Check your browser clipboard permissions."); }
  };

  const onDelete = () => {
    mutate({ id })
      .then(() => {
        toast.success("Board deleted");
        if (pathname.startsWith("/board/")) router.push("/");
        else router.refresh();
      })
      .catch(() => toast.error("Failed to delete board"));
  };

  return (
    <>
    <DropdownMenu modal={false} onOpenChange={open => { if (open) restoreFocus.current = true; }}>
      <DropdownMenuTrigger ref={trigger} asChild onClick={event => { event.preventDefault(); event.stopPropagation(); }}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onInteractOutside={() => { restoreFocus.current = false; }}
        onCloseAutoFocus={event => { event.preventDefault(); if (restoreFocus.current) trigger.current?.focus({ preventScroll: true }); }}
        side={side}
        sideOffset={sideOffset}
        align="end"
        className="w-60"
      >
        <DropdownMenuItem onSelect={() => void onCopyLink()} className="p-3 cursor-pointer">
          <Link2 className="h-4 w-4 mr-2" />
          Copy board link
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => { restoreFocus.current = false; onOpen(id, title); }}
          className="p-3 cursor-pointer"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={() => { restoreFocus.current = false; setDeleteOpen(true); }} className="p-3 cursor-pointer">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent onClick={event => event.stopPropagation()} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }}>
        <AlertDialogHeader><AlertDialogTitle>Delete board?</AlertDialogTitle><AlertDialogDescription>This permanently deletes the board and all its contents for every member.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={pending} onClick={onDelete}>Delete board</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default Actions;
