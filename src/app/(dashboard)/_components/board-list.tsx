"use client";
import React from "react";
import EmptySearch from "./empty-search";
import EmptyFavourites from "./empty-favourites";
import EmptyBoard from "./empty-board";

interface BoardListProps {
  orgId: string;
  query: { search?: string; favourites?: string };
}
const BoardList = ({ orgId, query }: BoardListProps) => {
  const data = []; // TODO: Change to API call

  if (!data?.length && query.search) {
    return <EmptySearch />;
  }

  if (!data?.length && query.favourites) {
    return <EmptyFavourites />;
  }

  if (!data?.length) {
    return <EmptyBoard />;
  }

  return <div>{JSON.stringify(query)}</div>;
};

export default BoardList;
