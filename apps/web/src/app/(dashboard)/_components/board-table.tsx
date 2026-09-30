"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter, Plus, Star } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BoardRow = Doc<"boards"> & { isFavourite: boolean };
type SortColumn = "title" | "created" | "owner";

export default function BoardTable({ boards }: { boards: BoardRow[] }) {
  const [now] = useState(() => Date.now());
  const [owner, setOwner] = useState("all");
  const [created, setCreated] = useState("all");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" }>({
    column: "created",
    direction: "desc",
  });
  const { mutate: favourite, pending: addingFavourite } = useApiMutation(api.board.favourite);
  const { mutate: unfavourite, pending: removingFavourite } = useApiMutation(api.board.unfavourite);

  const owners = useMemo(
    () => Array.from(new Set(boards.map((board) => board.authorName))).sort(),
    [boards],
  );

  const visibleBoards = useMemo(() => {
    const cutoff = created === "7" ? now - 7 * 86400000 : created === "30" ? now - 30 * 86400000 : 0;
    return boards
      .filter((board) => owner === "all" || board.authorName === owner)
      .filter((board) => !cutoff || board._creationTime >= cutoff)
      .filter((board) => !favouritesOnly || board.isFavourite)
      .sort((a, b) => {
        const comparison =
          sort.column === "title"
            ? a.title.localeCompare(b.title)
            : sort.column === "owner"
              ? a.authorName.localeCompare(b.authorName)
              : a._creationTime - b._creationTime;
        return sort.direction === "asc" ? comparison : -comparison;
      });
  }, [boards, created, favouritesOnly, now, owner, sort]);

  const changeSort = (column: SortColumn) => {
    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleFavourite = async (board: BoardRow) => {
    try {
      if (board.isFavourite) await unfavourite({ id: board._id });
      else await favourite({ id: board._id, orgId: board.orgId });
    } catch {
      toast.error("Could not update favourite status");
    }
  };

  const sortIcon = (column: SortColumn) =>
    sort.column === column
      ? sort.direction === "asc"
        ? <ChevronUp className="size-3.5" />
        : <ChevronDown className="size-3.5" />
      : null;

  return (
    <section className="board-data-table" aria-label="Board table">
      <div className="board-data-table__toolbar">
        <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
          <Filter className="size-4" /> Filters
        </button>
        <button
          type="button"
          className={cn(favouritesOnly && "is-active")}
          onClick={() => setFavouritesOnly((value) => !value)}
          aria-pressed={favouritesOnly}
        >
          <Star className={cn("size-4", favouritesOnly && "fill-current")} /> Favourites
        </button>
        <span>{visibleBoards.length} of {boards.length} boards</span>
      </div>

      {filtersOpen && (
        <div className="board-data-table__filters">
          <label>
            Owner
            <select value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option value="all">All owners</option>
              {owners.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            Created
            <select value={created} onChange={(event) => setCreated(event.target.value)}>
              <option value="all">Any time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
          <button type="button" onClick={() => { setOwner("all"); setCreated("all"); setFavouritesOnly(false); }}>Clear filters</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th><button type="button" onClick={() => changeSort("title")}>Name {sortIcon("title")}</button></th>
              <th><button type="button" onClick={() => changeSort("created")}>Created {sortIcon("created")}</button></th>
              <th><button type="button" onClick={() => changeSort("owner")}>Owner {sortIcon("owner")}</button></th>
              <th><span className="sr-only">Favourite</span></th>
            </tr>
          </thead>
          <tbody>
            {visibleBoards.map((board) => (
              <tr key={board._id}>
                <td>
                  <Link href={`/board/${board._id}`}>
                    <span className="board-data-table__thumbnail"><Plus className="size-4" /></span>
                    <strong>{board.title}</strong>
                  </Link>
                </td>
                <td>{new Date(board._creationTime).toLocaleDateString()}</td>
                <td>{board.authorName}</td>
                <td>
                  <button
                    type="button"
                    className="board-data-table__star"
                    aria-label={board.isFavourite ? `Remove ${board.title} from favourites` : `Add ${board.title} to favourites`}
                    disabled={addingFavourite || removingFavourite}
                    onClick={() => toggleFavourite(board)}
                  >
                    <Star className={cn("size-4", board.isFavourite && "fill-current")} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibleBoards.length && <p className="board-data-table__empty">No boards match these filters.</p>}
    </section>
  );
}
