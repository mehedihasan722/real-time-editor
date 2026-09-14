"use client";
import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";
import BoardCard from "./board-card";
import NewBoardButton from "./new-board-button";
import TemplateGallery from "./template-gallery";
import EmptySearch from "./empty-search";
import EmptyFavourites from "./empty-favourites";
import EmptyBoard from "./empty-board";

interface BoardListProps { orgId: string; query: { search?: string; favourites?: string }; }

const BoardList = ({ orgId, query }: BoardListProps) => {
  const data = useQuery(api.boards.get, { orgId, ...query });
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const sortedData = useMemo(() => [...(data ?? [])].sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : b._creationTime - a._creationTime), [data, sort]);

  if (data === undefined) return <div><div className="h-48 rounded-xl bg-slate-100 animate-pulse mb-8" /><div className="h-9 w-64 rounded bg-slate-100 animate-pulse" /></div>;
  if (!data.length && query.search) return <EmptySearch />;
  if (!data.length && query.favourites) return <EmptyFavourites />;
  if (!data.length) return <div><TemplateGallery orgId={orgId} /><EmptyBoard /></div>;

  return <div>
    {!query.favourites && <TemplateGallery orgId={orgId} />}
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h2 className="text-2xl font-semibold text-[#252936]">{query.favourites ? "Starred boards" : "Boards in this team"}</h2>
      <div className="w-[170px]"><NewBoardButton orgId={orgId} compact /></div>
    </div>
    <div className="flex items-center gap-3 mb-5 text-sm text-slate-500">
      <span>Sort by</span>
      <select aria-label="Sort boards" value={sort} onChange={e => setSort(e.target.value as "recent" | "name")} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700"><option value="recent">Recently created</option><option value="name">Name</option></select>
      <div className="ml-auto flex rounded-md border border-slate-200 bg-white p-1">
        <button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-slate-100 text-slate-900" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
        <button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-slate-100 text-slate-900" : ""}`}><List className="h-4 w-4" /></button>
      </div>
    </div>
    {view === "grid" ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-10">{sortedData.map(board => <BoardCard key={board._id} id={board._id} title={board.title} imageUrl={board.imageUrl} authorId={board.authorId} authorName={board.authorName} createdAt={board._creationTime} orgId={board.orgId} isFavourite={board.isFavourite} />)}</div> :
      <div className="overflow-x-auto"><div className="min-w-[600px]"><div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr] px-4 py-3 text-xs text-slate-500 border-b"><span>Name</span><span>Created</span><span>Owner</span></div>{sortedData.map(board => <Link key={board._id} href={`/board/${board._id}`} className="grid grid-cols-[minmax(0,2fr)_1fr_1fr] items-center px-4 py-4 text-sm rounded-lg hover:bg-[#f4f6fa] transition-colors"><div className="flex items-center gap-3 min-w-0"><div className="h-10 w-12 shrink-0 rounded-md bg-[#fff4c5] border border-[#eadb9c] flex items-center justify-center"><Plus className="h-4 w-4" /></div><span className="font-semibold truncate">{board.title}</span></div><span className="text-slate-500">{new Date(board._creationTime).toLocaleDateString()}</span><span className="text-slate-500 truncate">{board.authorName}</span></Link>)}</div></div>}
  </div>;
};
export default BoardList;
