"use client";
import React from "react";
import EmptyOrg from "./_components/empty-org";
import { useOrganization } from "@clerk/nextjs";
import BoardList from "./_components/board-list";

interface DashBoardPageProps {
  searchParams: { search?: string; favourites?: string };
}
const DashboardPage = ({ searchParams }: DashBoardPageProps) => {
  const { organization } = useOrganization();

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!organization ? (
        <EmptyOrg />
      ) : (
        <div>
          {!searchParams.favourites && !searchParams.search && <section className="future-hero">
            <div><span className="future-hero__eyebrow">YOUR CREATIVE SPACE</span>
              <h1>Ideas without limits.</h1>
              <p>Think together, map what matters, and turn your next big idea into a shared board.</p>
            </div>
            <div className="future-hero__art" aria-hidden="true"><i /><i /><i /></div>
          </section>}
          <BoardList orgId={organization.id} query={searchParams} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
