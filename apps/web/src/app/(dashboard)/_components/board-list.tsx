"use client";
import React, { useCallback, useMemo, useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import BoardCard from "./board-card";
import NewBoardButton from "./new-board-button";
import TemplateGallery from "./template-gallery";
import EmptySearch from "./empty-search";
import EmptyFavourites from "./empty-favourites";
import EmptyBoard from "./empty-board";
import BoardTable from "./board-table";
import BoardPagination, { currentBoardPage } from "./board-pagination";
import "./board-browse.css";

interface BoardListProps { orgId: string; query: { search?: string; favourites?: string }; }

const BoardList = ({ orgId, query }: BoardListProps) => {
  const { results: data, status, loadMore } = usePaginatedQuery(api.boards.list, { orgId, ...query }, { initialNumItems: 20 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const changePageSize = useCallback((size: number) => { setPageSize(size); setPage(1); }, []);
  const fetchMore = useCallback((size: number) => loadMore(size), [loadMore]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const sortedData = useMemo(() => [...(data ?? [])].sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : b._creationTime - a._creationTime), [data, sort]);

  const hasMore = status !== "Exhausted";
  const loadingMore = status === "LoadingMore";
  const current = currentBoardPage(page, sortedData.length, pageSize, hasMore);
  const pageData = sortedData.slice((current - 1) * pageSize, current * pageSize);
  if (status === "LoadingFirstPage") return <div><div className="h-48 rounded-xl bg-slate-100 animate-pulse mb-8" /><div className="h-9 w-64 rounded bg-slate-100 animate-pulse" /></div>;
  if (!data.length && status === "Exhausted" && query.search) return <EmptySearch />;
  if (!data.length && status === "Exhausted" && query.favourites) return <EmptyFavourites />;
  if (!data.length && status === "Exhausted") return <div><TemplateGallery orgId={orgId} /><EmptyBoard /></div>;

  return <div>
    {!query.favourites && <TemplateGallery orgId={orgId} />}
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h2 className="text-2xl font-semibold text-[#252936] dark:text-slate-100">{query.favourites ? "Starred boards" : "Boards in this team"}</h2>
      <div className="flex items-center gap-2"><Link href="/templates" className="h-9 px-3 rounded-md border border-slate-200 bg-white flex items-center text-sm font-semibold hover:border-[#4262ff]">Explore templates</Link><div className="w-[170px]"><NewBoardButton orgId={orgId} compact /></div></div>
    </div>
    <div className="flex items-center gap-3 mb-5 text-sm text-slate-500">
      <span>Sort by</span>
      <select aria-label="Sort boards" value={sort} onChange={e => { setSort(e.target.value as "recent" | "name"); setPage(1); }} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-700"><option value="recent">Recently created</option><option value="name">Name</option></select>
      <div className="ml-auto flex rounded-md border border-slate-200 bg-white p-1">
        <button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-slate-100 text-slate-900" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
        <button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-slate-100 text-slate-900" : ""}`}><List className="h-4 w-4" /></button>
      </div>
    </div>
    {view === "grid" ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-10">{pageData.map(board => <BoardCard key={board._id} id={board._id} title={board.title} imageUrl={board.imageUrl} authorId={board.authorId} authorName={board.authorName} createdAt={board._creationTime} orgId={board.orgId} isFavourite={board.isFavourite} />)}</div> :
      <BoardTable key={sort} order={sort} boards={sortedData} page={page} pageSize={pageSize} onSize={changePageSize} onPage={setPage} hasMore={hasMore} loading={loadingMore} onLoadMore={fetchMore} />}
    {view === "grid" && <BoardPagination count={sortedData.length} page={page} size={pageSize} onSize={changePageSize} onPage={setPage} hasMore={hasMore} loading={loadingMore} onLoadMore={fetchMore} />}
    {hasMore && <p className="board-browse-note">More boards load as you browse. Sorting and local filters apply to loaded boards.</p>}
  </div>;
};
export default function ScopedBoardList(props: BoardListProps) { return <BoardList key={props.orgId + ":" + (props.query.search ?? "") + ":" + (props.query.favourites ?? "")} {...props} />; }
