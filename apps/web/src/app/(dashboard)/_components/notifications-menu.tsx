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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open notifications" className="relative grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        <Bell className="size-5" />
        {latestBoard && <span className="absolute right-2 top-2 size-2 rounded-full bg-indigo-500 ring-2 ring-white" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
          <div><p className="font-bold text-slate-950">Notifications</p><p className="mt-0.5 text-xs text-slate-500">Workspace activity and shortcuts</p></div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-600 shadow-sm">{latestBoard ? "1 new" : "Up to date"}</span>
        </header>

        {latestBoard ? (
          <DropdownMenuItem asChild className="cursor-pointer p-0 focus:bg-indigo-50">
            <Link href={`/board/${latestBoard._id}`} prefetch className="group flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Clock3 className="size-4" /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">Continue {latestBoard.title}</strong><small className="mt-1 block text-xs leading-5 text-slate-500">Your most recent team board is ready. Open it instantly and continue collaborating.</small></span>
              <ArrowRight className="mt-2 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
            </Link>
          </DropdownMenuItem>
        ) : (
          <div className="flex items-start gap-3 px-5 py-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="size-4" /></span>
            <div><strong className="text-sm text-slate-900">You’re all caught up</strong><p className="mt-1 text-xs leading-5 text-slate-500">Board activity and invitations will appear here.</p></div>
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-[11px] font-semibold text-slate-500">Flowboard workspace notifications</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
