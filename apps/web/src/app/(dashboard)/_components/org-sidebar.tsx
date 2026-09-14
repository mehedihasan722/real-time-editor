"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Star, Shield, BookOpen, Shapes } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";


export const OrgSidebar = () => {
  const searchParams = useSearchParams();
  const { orgRole } = useAuth();
  const favourites = searchParams.get("favourites");

  return (
    <div className="hidden lg:flex flex-col space-y-6 w-[206px] pl-5 pt-5">
      <Link href="/">
        <div className="flex items-center  gap-x-2">
          <Image alt="logo" src="/logo.svg" height={60} width={60} />
          <span className={cn("font-semibold text-2xl", "font-display")}>
            Flowboard
          </span>
        </div>
      </Link>
      <OrganizationSwitcher
        hidePersonal
        appearance={{
          elements: {
            rootBox: {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            },
            organizationSwitcherTrigger: {
              padding: "6px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              justifyContent: "space-between",
              backgroundColor: "white",
            },
          },
        }}
      />
      <div className="space-y-1 w-full">
        <Button
          variant={favourites ? "ghost" : "secondary"}
          asChild
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link href="/">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Team boards
          </Link>
        </Button>
        <Button
          variant={favourites ? "secondary" : "ghost"}
          asChild
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link
            href={{
              pathname: "/",
              query: { favourites: true },
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            Favourite boards
          </Link>
        </Button>
        <Button variant="ghost" asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/templates"><Shapes className="h-4 w-4 mr-2" />Templates</Link></Button>
        <Button variant="ghost" asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/guide"><BookOpen className="h-4 w-4 mr-2" />Guide</Link></Button>
        {orgRole === "org:admin" && <Button variant="ghost" asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/admin"><Shield className="h-4 w-4 mr-2" />Admin dashboard</Link></Button>}
      </div>
    </div>
  );
};
