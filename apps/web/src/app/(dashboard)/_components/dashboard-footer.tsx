import Link from "next/link";
import { ArrowUpRight, GitFork, Orbit } from "lucide-react";

const footerLinks = [
  { href: "/", label: "Boards" },
  { href: "/templates", label: "Templates" },
  { href: "/games", label: "Games" },
  { href: "/guide", label: "Guide" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export const DashboardFooter = () => (
  <footer className="relative mx-4 mb-4 mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-6 text-slate-600 shadow-xl dark:border-white/10 dark:bg-[#191c20] dark:text-slate-300 sm:px-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-64 rounded-full bg-orange-500/10 blur-3xl" />
    <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
      <Link href="/" className="group flex w-fit items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400">
        <span className="grid size-11 place-items-center rounded-xl border border-orange-400/25 bg-gradient-to-br from-orange-400/20 to-orange-600/5 text-orange-700 dark:text-orange-300 transition-colors group-hover:border-orange-400/60">
          <Orbit className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Flowboard<span className="text-orange-400">.</span></p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">A little space. Your next big idea.</p>
        </div>
      </Link>
      <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-1 text-xs font-medium">
        {footerLinks.map(link => (
          <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 transition-colors hover:bg-white/5 hover:text-orange-700 dark:hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">{link.label}</Link>
        ))}
        <a href="https://github.com/mehedihasan722/real-time-editor" target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-white/30 bg-white/[0.03] px-3 py-2 transition-colors hover:border-orange-400/40 hover:text-orange-700 dark:hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">
          <GitFork className="size-3.5" aria-hidden="true" /> GitHub <ArrowUpRight className="size-3" aria-hidden="true" />
        </a>
      </nav>
    </div>
    <div className="relative mt-6 flex flex-col justify-between gap-3 border-t border-slate-300 dark:border-white/20 pt-4 text-[11px] text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center">
      <span>© {new Date().getFullYear()} Flowboard. Made for creative teams.</span>
      <span className="flex items-center gap-2"><Orbit className="size-3 text-orange-400/70" aria-hidden="true" /> Imagine. Connect. Create.</span>
    </div>
  </footer>
);
