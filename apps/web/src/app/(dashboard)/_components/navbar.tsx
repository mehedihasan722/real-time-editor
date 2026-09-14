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

export const Navbar = () => {
  const { organization } = useOrganization();
  return (
    <div className="flex items-center gap-x-3 p-4 md:p-5 min-w-0">
      <MobileNav />
      <div className="hidden lg:flex lg:flex-1">
        {/* TODO: Add Search  */}
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
                border: "1px solid #E5E7EB",
                justifyContent: "space-between",
                backgroundColor: "white",
              },
            },
          }}
        />
      </div>
      {organization && <div className="hidden sm:block"><InviteButton /></div>}
      <UserButton />
    </div>
  );
};
