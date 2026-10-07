import Link from "next/link";
import { Asterisk, ArrowUpRight, BookOpen, Code2, LayoutDashboard, Shapes, Settings } from "lucide-react";

const destinations = [
  { href: "/", label: "Your workspace", icon: LayoutDashboard },
  { href: "/templates", label: "Explore templates", icon: Shapes },
  { href: "/guide", label: "Read the guide", icon: BookOpen },
  { href: "/settings", label: "Workspace settings", icon: Settings },
];

export const DashboardFooter = () => (
  <footer className="editorial-footer">
    <div className="editorial-footer__top">
      <div><p className="editorial-kicker">A LITTLE SPACE. YOUR NEXT BIG IDEA.</p><h2>Make room<br />for what’s next<span>.</span></h2><Link className="editorial-pill" href="/templates">Find your starting point <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      <div className="editorial-footer__directory"><p className="editorial-kicker">KEEP EXPLORING</p><nav aria-label="Footer navigation">{destinations.map(({href,label,icon:Icon}) => <Link key={href} href={href}><Icon size={16} aria-hidden="true" />{label}<ArrowUpRight size={15} aria-hidden="true" /></Link>)}</nav><a href="https://github.com/mehedihasan722/real-time-editor" target="_blank" rel="noopener noreferrer" className="editorial-footer__source"><Code2 size={17} aria-hidden="true" /> Follow the project <span className="sr-only">(opens in a new tab)</span><ArrowUpRight size={15} aria-hidden="true" /></a></div>
    </div>
    <Link href="/welcome" className="editorial-footer__wordmark" aria-label="Flowboard product home">flowboard<span aria-hidden="true"><Asterisk size="1em" strokeWidth={1.2} /></span></Link>
    <div className="editorial-footer__bottom"><span>© {new Date().getFullYear()} Flowboard</span><span>Imagine. Connect. Create.</span><Link href="/settings">Privacy &amp; appearance settings <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
  </footer>
);
