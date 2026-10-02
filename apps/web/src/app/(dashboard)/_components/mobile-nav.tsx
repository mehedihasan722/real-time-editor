"use client";
import { useAuth } from "@clerk/nextjs";
import { canAdminister, workspaceRole } from "@/lib/roles";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Star, Menu, LayoutDashboard, Shapes, BookOpen, Shield, Settings, Gamepad2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function MobileNav() {
  const { orgRole } = useAuth();
  const pathname = usePathname();
  const favourites = useSearchParams().get("favourites");
  const active = (href: string) => pathname === href || pathname?.startsWith(href + "/") === true;
  return <DropdownMenu><DropdownMenuTrigger aria-label="Open navigation" className="lg:hidden rounded-md border border-border p-2"><Menu className="h-5 w-5" /></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52">
      <DropdownMenuItem asChild><Link href="/" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={pathname === "/" && !favourites ? "page" : undefined}><LayoutDashboard className="h-4 w-4 mr-2" />Boards</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/?favourites=true" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={pathname === "/" && !!favourites ? "page" : undefined}><Star className="h-4 w-4 mr-2" />Favourites</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/templates" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={active("/templates") ? "page" : undefined}><Shapes className="h-4 w-4 mr-2" />Templates</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/games" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={active("/games") ? "page" : undefined}><Gamepad2 className="h-4 w-4 mr-2" />Games</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/guide" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={active("/guide") ? "page" : undefined}><BookOpen className="h-4 w-4 mr-2" />Guide</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/settings" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={active("/settings") ? "page" : undefined}><Settings className="h-4 w-4 mr-2" />Settings</Link></DropdownMenuItem>
      {canAdminister(workspaceRole(orgRole)) && <DropdownMenuItem asChild><Link href="/admin" className="aria-[current=page]:bg-secondary aria-[current=page]:font-semibold" aria-current={active("/admin") ? "page" : undefined}><Shield className="h-4 w-4 mr-2" />Admin</Link></DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
