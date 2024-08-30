"use client";
import React from "react";

interface BoardListProps {
  orgId: string;
  query: { search?: string; favourites?: string };
}
const BoardList = ({ orgId, query }: BoardListProps) => {
  const data = []; // TODO: Change to API call

  if (!data?.length && query.search) {
    return <div>Try searching for something else</div>;
  }

  if (!data?.length && query.favourites) {
    return <div>No favourites</div>;
  }

  if (!data?.length) {
    return <div>No Boards at all</div>;
  }

  return <div>{JSON.stringify(query)}</div>;
};

export default BoardList;
