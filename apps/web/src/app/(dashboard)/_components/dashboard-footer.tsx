import Link from "next/link";
import { ArrowUpRight, GitFork, Orbit, LayoutDashboard, Shapes, Gamepad2, BookOpen, Settings } from "lucide-react";

const footerLinks = [
  { href: "/", label: "Boards", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: Shapes },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/guide", label: "Guide", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const DashboardFooter = () => (
  <footer className="relative mx-4 mb-4 mt-10 overflow-hidden rounded-2xl border border-border bg-background/80 backdrop-blur-md px-6 py-6 text-muted-foreground shadow-sm sm:px-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-64 rounded-full bg-primary/10 blur-3xl" />
    <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
      <Link href="/" className="group flex w-fit items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <span className="grid size-11 place-items-center rounded-xl border border-primary/25 bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-colors group-hover:border-primary/60">
          <Orbit className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">Flowboard<span className="text-primary">.</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">A little space. Your next big idea.</p>
        </div>
      </Link>
      <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-1 text-xs font-medium">
        {footerLinks.map(link => (
          <Link key={link.href} href={link.href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><link.icon className="size-3.5" aria-hidden="true" />{link.label}</Link>
        ))}
        <a href="https://github.com/mehedihasan722/real-time-editor" target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <GitFork className="size-3.5" aria-hidden="true" /> GitHub <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      </nav>
    </div>
    <div className="relative mt-6 flex flex-col justify-between gap-3 border-t border-border pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
      <span>© {new Date().getFullYear()} Flowboard. Made for creative teams.</span>
      <span className="flex items-center gap-2"><Orbit className="size-3 text-primary/60" aria-hidden="true" /> Imagine. Connect. Create.</span>
    </div>
  </footer>
);
