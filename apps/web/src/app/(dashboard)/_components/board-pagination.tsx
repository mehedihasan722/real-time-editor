"use client";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function currentBoardPage(page: number, count: number, size: number, hasMore: boolean) {
  return Math.max(1, hasMore ? page : Math.min(page, Math.max(1, Math.ceil(count / size))));
}

export default function BoardPagination({ count, page, size, hasMore, loading, onPage, onLoadMore, onSize }: { count: number; page: number; size: number; hasMore: boolean; loading: boolean; onPage: (page: number) => void; onLoadMore: (size: number) => void; onSize: (size: number) => void }) {
  const current = currentBoardPage(page, count, size, hasMore);
  useEffect(() => { if (count < current * size && hasMore && !loading) onLoadMore(size); }, [count, current, size, hasMore, loading, onLoadMore]);
  const pages = Math.max(1, Math.ceil(count / size));
  const first = Math.max(1, Math.min(current - 2, pages - 4));
  return <nav className="board-pagination" aria-label="Board pagination"><div className="board-pagination-summary"><label className="board-page-size">Rows per page<select aria-label="Boards per page" value={size} onChange={event => onSize(Number(event.target.value))}>{[10, 15, 20, 25, 50].map(value => <option key={value} value={value}>{value}</option>)}</select></label><span aria-live="polite">{loading && count < current * size ? "Loading boards…" : count ? `${Math.min((current - 1) * size + 1, count)}–${Math.min(current * size, count)} of ${count}${hasMore ? "+" : ""} boards` : "0 boards"}</span></div><div><button disabled={current === 1 || loading} onClick={() => onPage(1)} aria-label="First board page"><ChevronsLeft size={15} /></button><button disabled={current === 1 || loading} onClick={() => onPage(current - 1)} aria-label="Previous board page"><ChevronLeft size={15} /></button><div className="board-page-numbers">{Array.from({ length: Math.min(5, pages) }, (_, index) => first + index).map(number => <button key={number} disabled={loading} aria-current={number === current ? "page" : undefined} aria-label={`Board page ${number}`} onClick={() => onPage(number)}>{number}</button>)}</div><span className="sr-only">Page {current}{hasMore ? "" : ` of ${pages}`}</span><button disabled={loading || (!hasMore && current >= pages)} onClick={() => onPage(current + 1)} aria-label="Next board page"><ChevronRight size={15} /></button><button disabled={hasMore || loading || current >= pages} onClick={() => onPage(pages)} aria-label="Last board page" title={hasMore ? "Available after remaining boards load" : "Last page"}><ChevronsRight size={15} /></button></div></nav>;
}
