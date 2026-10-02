"use client";

import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ArrowRight, Bell, CheckCircle2, Clock3 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NotificationsMenu = () => {
  const { organization } = useOrganization();
  const boards = useQuery(api.boards.get, organization ? { orgId: organization.id } : "skip");
  const latestBoard = boards?.[0];
  const loading = !!organization && boards === undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open notifications" className="relative grid size-10 place-items-center rounded-lg border border-border bg-background text-foreground transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="size-5" />

      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="workspace-notifications w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border-border p-0 shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <div><p className="font-bold text-foreground">Workspace activity</p><p className="mt-0.5 text-xs text-muted-foreground">Workspace activity and shortcuts</p></div>
          <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold text-primary shadow-sm">{latestBoard ? "Recent board" : loading ? "Loading…" : "No boards"}</span>
        </header>

        {latestBoard ? (
          <DropdownMenuItem asChild className="cursor-pointer p-0 focus:bg-muted">
            <Link href={`/board/${latestBoard._id}`} prefetch className="group flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="size-4" /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-foreground">Continue {latestBoard.title}</strong><small className="mt-1 block text-xs leading-5 text-muted-foreground">Your most recent team board is ready. Open it instantly and continue collaborating.</small></span>
              <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </DropdownMenuItem>
        ) : (
          <div className="flex items-start gap-3 px-5 py-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><CheckCircle2 className="size-4" /></span>
            <div><strong className="text-sm text-foreground">{loading ? "Loading workspace…" : "No recent boards"}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{loading ? "Checking your team boards." : "Create a board to start collaborating with your team."}</p></div>
          </div>
        )}

        <div className="border-t border-border bg-muted/30 px-5 py-3 text-center text-[11px] font-semibold text-muted-foreground">Flowboard workspace activity</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
