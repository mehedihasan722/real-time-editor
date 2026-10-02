"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Star, Shapes, Gamepad2, Settings, BookOpen } from "lucide-react";
const destinations = [{ label: "Favourites", icon: Star, href: "/?favourites=true" }, { label: "Team boards", icon: LayoutDashboard, href: "/" }, { label: "Templates", icon: Shapes, href: "/templates" }, { label: "Games", icon: Gamepad2, href: "/games" }, { label: "Settings", icon: Settings, href: "/settings" }, { label: "Guide", icon: BookOpen, href: "/guide" }];
export function WorkspaceCommand() {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(current => !current); setQuery(""); } };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, []);
  const results = destinations.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setQuery(""); }}><DialogContent><DialogTitle>Go to workspace</DialogTitle><DialogDescription>Search destinations. Use Tab to select a result and Enter to open it.</DialogDescription><Input autoFocus aria-label="Search workspace destinations" value={query} onChange={event => setQuery(event.target.value)} /><nav aria-label="Workspace destinations" className="space-y-1">{results.map(item => <button key={item.href} className="flex items-center gap-3 w-full rounded-lg px-3 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setOpen(false); router.push(item.href); }}><item.icon size={17} aria-hidden="true" />{item.label}</button>)}{!results.length && <p role="status" className="p-3 text-sm text-muted-foreground">No destinations match your search.</p>}</nav></DialogContent></Dialog>;
}
