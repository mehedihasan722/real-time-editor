"use client";
import React, { use } from "react";
import EmptyOrg from "./_components/empty-org";
import { useOrganization } from "@clerk/nextjs";
import BoardList from "./_components/board-list";
import { HomeCarousel } from "./_components/home-carousel";
import { WorkflowShowcase } from "@/components/workflow-showcase";

interface DashBoardPageProps {
  searchParams: Promise<{ search?: string; favourites?: string }>;
}
const DashboardPage = ({ searchParams }: DashBoardPageProps) => {
  const resolvedSearchParams = use(searchParams);
  const { organization } = useOrganization();

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-6">
      {!organization ? (
        <EmptyOrg />
      ) : (
        <div>
          {!resolvedSearchParams.favourites && !resolvedSearchParams.search && <HomeCarousel />}
          <BoardList orgId={organization.id} query={resolvedSearchParams} />
        </div>
      )}
      {!resolvedSearchParams.favourites && !resolvedSearchParams.search && <WorkflowShowcase />}
    </div>
  );
};

export default DashboardPage;
