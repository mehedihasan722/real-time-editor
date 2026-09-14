"use client";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Menu, LayoutDashboard, Shapes, BookOpen, Shield } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function MobileNav() {
  const { orgRole } = useAuth();
  return <DropdownMenu><DropdownMenuTrigger aria-label="Open navigation" className="lg:hidden rounded-md border border-slate-200 p-2"><Menu className="h-5 w-5" /></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52">
      <DropdownMenuItem asChild><Link href="/"><LayoutDashboard className="h-4 w-4 mr-2" />Boards</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/templates"><Shapes className="h-4 w-4 mr-2" />Templates</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/guide"><BookOpen className="h-4 w-4 mr-2" />Guide</Link></DropdownMenuItem>
      {orgRole === "org:admin" && <DropdownMenuItem asChild><Link href="/admin"><Shield className="h-4 w-4 mr-2" />Admin</Link></DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
