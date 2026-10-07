"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Star, Shield, BookOpen, Shapes, Settings, Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { canAdminister, workspaceRole } from "@/lib/roles";


export const OrgSidebar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isSection = (href: string) => pathname === href || pathname?.startsWith(href + "/") === true;
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
              border: "1px solid var(--clerk-border)",
              justifyContent: "space-between",
              backgroundColor: "var(--clerk-surface)",
              color: "var(--clerk-foreground)",
            },
            organizationPreviewMainIdentifier: { color: "var(--clerk-foreground)" },
            organizationPreviewSecondaryIdentifier: { color: "var(--clerk-muted)" },
            organizationSwitcherTriggerIcon: { color: "var(--clerk-foreground)" },
          },
        }}
      />
      <div className="space-y-1 w-full">
        <Button
          variant={pathname === "/" && !favourites ? "secondary" : "ghost"}
          asChild
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link href="/" aria-current={pathname === "/" && !favourites ? "page" : undefined}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Team boards
          </Link>
        </Button>
        <Button
          variant={pathname === "/" && favourites ? "secondary" : "ghost"}
          asChild
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link
            aria-current={pathname === "/" && favourites ? "page" : undefined}
            href={{
              pathname: "/",
              query: { favourites: true },
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            Favourite boards
          </Link>
        </Button>
        <Button variant={isSection("/templates") ? "secondary" : "ghost"} asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/templates" aria-current={isSection("/templates") ? "page" : undefined}><Shapes className="h-4 w-4 mr-2" />Templates</Link></Button>
        <Button variant={isSection("/games") ? "secondary" : "ghost"} asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/games" aria-current={isSection("/games") ? "page" : undefined}><Gamepad2 className="h-4 w-4 mr-2" />Games</Link></Button>
        <Button variant={isSection("/guide") ? "secondary" : "ghost"} asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/guide" aria-current={isSection("/guide") ? "page" : undefined}><BookOpen className="h-4 w-4 mr-2" />Guide</Link></Button>
        <Button variant={isSection("/settings") ? "secondary" : "ghost"} asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/settings" aria-current={isSection("/settings") ? "page" : undefined}><Settings className="h-4 w-4 mr-2" />Settings</Link></Button>
        {canAdminister(workspaceRole(orgRole)) && <Button variant={isSection("/admin") ? "secondary" : "ghost"} asChild size="lg" className="font-normal justify-start px-2 w-full"><Link href="/admin" aria-current={isSection("/admin") ? "page" : undefined}><Shield className="h-4 w-4 mr-2" />Admin dashboard</Link></Button>}
      </div>
    </div>
  );
};
