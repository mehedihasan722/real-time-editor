"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
const destinations = [{ label: "Team boards", href: "/" }, { label: "Templates", href: "/templates" }, { label: "Games", href: "/games" }, { label: "Settings", href: "/settings" }, { label: "Guide", href: "/guide" }];
export function WorkspaceCommand() {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(current => !current); } };
    window.addEventListener("keydown", keydown); return () => window.removeEventListener("keydown", keydown);
  }, []);
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setQuery(""); }}><DialogContent><DialogTitle>Go to workspace</DialogTitle><DialogDescription>Search destinations. Use Tab to select a result and Enter to open it.</DialogDescription><Input autoFocus aria-label="Search workspace destinations" value={query} onChange={event => setQuery(event.target.value)} /><nav aria-label="Workspace destinations" className="space-y-1">{destinations.filter(item => item.label.toLowerCase().includes(query.toLowerCase())).map(item => <button key={item.href} className="block w-full rounded-lg px-3 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setOpen(false); router.push(item.href); }}>{item.label}</button>)}</nav></DialogContent></Dialog>;
}
