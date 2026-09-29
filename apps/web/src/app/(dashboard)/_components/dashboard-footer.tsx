import Link from "next/link";
import { Github, Heart, Orbit } from "lucide-react";

const footerLinks = [
  { href: "/", label: "Boards" },
  { href: "/templates", label: "Templates" },
  { href: "/guide", label: "Guide" },
  { href: "/admin", label: "Admin" },
];

export const DashboardFooter = () => {
  return (
    <footer className="relative mx-4 mb-4 mt-10 overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/75 px-5 py-5 shadow-[0_18px_50px_rgba(45,62,130,0.10)] backdrop-blur-xl sm:px-7">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-44 w-44 rounded-full bg-indigo-300/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
            <Orbit className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-base font-bold text-slate-900">Flowboard</p>
            <p className="text-xs text-slate-500">Realtime space for ideas without limits.</p>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-indigo-600">
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/mehedihasan722/real-time-editor"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-indigo-600"
          >
            <Github className="size-4" aria-hidden="true" />
            GitHub
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.65)]" />
            Realtime ready
          </span>
          <span className="inline-flex items-center gap-1">
            Made with <Heart className="size-3.5 fill-rose-400 text-rose-400" aria-label="care" /> for creative teams
          </span>
        </div>
      </div>
    </footer>
  );
};
