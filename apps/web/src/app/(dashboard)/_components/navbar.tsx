"use client";
import {
  OrganizationSwitcher,
  useOrganization,
  UserButton,
} from "@clerk/nextjs";
import React from "react";
import SearchInput from "./search-input";
import InviteButton from "./invite-button";
import MobileNav from "./mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "./notifications-menu";

export const Navbar = () => {
  const { organization } = useOrganization();
  return (
    <div className="flex items-center gap-x-3 p-4 md:p-5 min-w-0">
      <MobileNav />
      <div className="hidden lg:flex lg:flex-1">
        <SearchInput />
      </div>
      <div className="block lg:hidden flex-1">
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                maxWidth: "376px",
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
      </div>
      {organization && <div className="hidden sm:block"><InviteButton /></div>}
      <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 md:inline">Free plan</span>
      <NotificationsMenu />
      <ThemeToggle />
      <UserButton />
    </div>
  );
};
