"use client";
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Activity, LayoutDashboard, Star, Users, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import Actions from "@/components/actions";
import NewBoardButton from "../_components/new-board-button";
import InviteButton from "../_components/invite-button";

export default function AdminDashboard({ orgId }: { orgId: string }) {
  const boards = useQuery(api.boards.get, { orgId });
  const stats = useMemo(() => {
    const all = boards ?? [];
    const owners = new Map<string, number>();
    all.forEach(board => owners.set(board.authorName, (owners.get(board.authorName) ?? 0) + 1));
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setDate(1); date.setMonth(date.getMonth() - (5 - i));
      const count = all.filter(board => { const d = new Date(board._creationTime); return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear(); }).length;
      return { label: date.toLocaleDateString(undefined, { month: "short" }), count };
    });
    return { all, owners: Array.from(owners).sort((a, b) => b[1] - a[1]), months, starred: all.filter(b => b.isFavourite).length };
  }, [boards]);
  const max = Math.max(1, ...stats.months.map(m => m.count));
  return <div className="px-6 pb-10 max-w-[1500px]">
    <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
      <div><p className="text-xs uppercase tracking-[.2em] font-bold text-[#5368b8]">Organization control center</p><h1 className="text-3xl font-bold mt-1">Admin dashboard</h1><p className="text-sm text-slate-500 mt-1">Live board activity and workspace controls.</p></div>
      <div className="flex gap-2 items-center"><InviteButton /><div className="w-[140px]"><NewBoardButton orgId={orgId} compact /></div></div>
    </div>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Metric icon={LayoutDashboard} label="Total boards" value={boards ? stats.all.length : "..."} />
      <Metric icon={Star} label="Starred by you" value={boards ? stats.starred : "..."} />
      <Metric icon={Users} label="Board owners" value={boards ? stats.owners.length : "..."} />
      <Metric icon={Activity} label="Created this month" value={boards ? stats.months[5].count : "..."} />
    </div>
    <div className="grid lg:grid-cols-[2fr_1fr] gap-5 mb-7">
      <section className="admin-panel"><h2>Board creation</h2><p className="admin-subtitle">New boards across the last six months</p><div className="admin-chart" role="img" aria-label="Board creation by month">{stats.months.map(m => <div key={m.label} className="admin-chart__column"><strong>{m.count}</strong><div style={{ height: String(Math.max(8, m.count / max * 100)) + "%" }} /><span>{m.label}</span></div>)}</div></section>
      <section className="admin-panel"><h2>Boards by owner</h2><p className="admin-subtitle">People creating this workspace</p><div className="space-y-4 mt-6">{stats.owners.length ? stats.owners.slice(0, 5).map(([name, count]) => <div key={name}><div className="flex justify-between text-sm mb-1"><span className="truncate">{name}</span><strong>{count}</strong></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#5c7cff] to-[#9b83fa]" style={{ width: String(count / Math.max(1, stats.all.length) * 100) + "%" }} /></div></div>) : <p className="text-sm text-slate-500">No board data yet.</p>}</div></section>
    </div>
    <section className="admin-panel"><div className="flex justify-between items-center"><div><h2>Manage boards</h2><p className="admin-subtitle">Open, rename, copy links, or delete a board</p></div><Link href="/" className="text-sm text-[#4262ff] font-semibold">View workspace</Link></div>
      <div className="overflow-x-auto mt-5"><div className="min-w-[560px]">{stats.all.map(board => <div key={board._id} className="grid grid-cols-[minmax(0,2fr)_1fr_48px] items-center gap-4 py-3 border-t border-slate-100"><Link href={"/board/" + board._id} className="font-medium truncate hover:text-[#4262ff]">{board.title}</Link><span className="text-xs text-slate-500 truncate">{board.authorName}</span><Actions id={board._id} title={board.title}><button aria-label={"Manage " + board.title} className="p-2 rounded-md hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button></Actions></div>)}{boards && !stats.all.length && <p className="text-sm text-slate-500 py-6">No boards yet. Create one to start tracking activity.</p>}</div></div>
    </section>
  </div>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof LayoutDashboard; label: string; value: number | string }) {
  return <div className="admin-panel flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-[#e9edff] text-[#5368d9] flex items-center justify-center"><Icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{label}</p><strong className="text-2xl">{value}</strong></div></div>;
}
