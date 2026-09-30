"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Activity, ArrowDownToLine, ArrowUpRight, BarChart3, ChevronRight, LayoutDashboard, MoreHorizontal, Search, Star, Users } from "lucide-react";
import Link from "next/link";
import Actions from "@/components/actions";
import NewBoardButton from "../_components/new-board-button";
import InviteButton from "../_components/invite-button";
import "./admin-dashboard.css";
import { createBoardCsv } from "@/lib/admin-report";

export default function AdminDashboard({ orgId }: { orgId: string }) {
  const boards = useQuery(api.boards.get, { orgId });
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("6");
  const stats = useMemo(() => {
    const all = boards ?? [];
    const owners = new Map<string, { name: string; count: number }>();
    all.forEach(board => {
      const owner = owners.get(board.authorId);
      owners.set(board.authorId, { name: board.authorName, count: (owner?.count ?? 0) + 1 });
    });
    const months = Array.from({ length: Number(period) }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (Number(period) - 1 - index));
      return {
        label: date.toLocaleDateString("en", { month: "short" }),
        count: all.filter(board => {
          const created = new Date(board._creationTime);
          return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
        }).length,
      };
    });
    return { all, owners: Array.from(owners.values()).sort((a, b) => b.count - a.count), months, starred: all.filter(board => board.isFavourite).length };
  }, [boards, period]);
  const filteredBoards = stats.all.filter(board => `${board.title} ${board.authorName}`.toLowerCase().includes(search.toLowerCase()));
  const maximum = Math.max(1, ...stats.months.map(month => month.count));
  const starredPercent = Math.round(stats.starred / Math.max(1, stats.all.length) * 100);
  const points = stats.months.map((month, index) => `${24 + index * 552 / Math.max(1, stats.months.length - 1)},${160 - month.count / maximum * 125}`).join(" ");

  const exportBoards = () => {
    const csv = createBoardCsv(filteredBoards);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "flowboard-workspace.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="admin-intelligence">
    <header className="ai-header">
      <div><div className="ai-breadcrumb"><LayoutDashboard size={13} /> Workspace <ChevronRight size={12} /> Overview</div><h1>Workspace intelligence<span>.</span></h1><p>A clear view of your team’s creative momentum.</p></div>
      <div className="ai-header-actions"><InviteButton /><button onClick={exportBoards} disabled={!boards} className="ai-export"><ArrowDownToLine size={15} /> Export report</button></div>
    </header>
    <div className="ai-status"><span className="ai-live-dot" /> Live workspace data <span className="ai-status-note">Based on up to 100 most recent boards</span><Link href="/">Open workspace <ArrowUpRight size={13} /></Link></div>

    <section className="ai-metrics" aria-label="Workspace metrics">
      {[{ label: "Total boards", value: stats.all.length, icon: LayoutDashboard, caption: "Ideas taking shape", bars: true }, { label: "Created this month", value: stats.months.at(-1)?.count ?? 0, icon: Activity, caption: "New creative spaces", bars: true }, { label: "Board owners", value: stats.owners.length, icon: Users, caption: "People contributing", bars: false }, { label: "Starred by you", value: stats.starred, icon: Star, caption: `${starredPercent}% of workspace boards`, bars: false }].map(({ label, value, icon: Icon, caption, bars }) => <article className="ai-metric" key={label}><div className="ai-metric-label"><span>{label}</span><Icon size={16} /></div><div className="ai-metric-body"><strong>{boards === undefined ? "—" : value}</strong>{bars ? <div className="ai-spark-bars" aria-hidden="true">{stats.months.map((month, index) => <i key={index} style={{ height: `${6 + month.count / maximum * 30}px` }} />)}</div> : <ArrowUpRight className="ai-metric-arrow" size={30} />}</div><small>{caption}</small></article>)}
    </section>

    <div className="ai-main-grid">
      <section className="ai-panel ai-growth"><div className="ai-panel-header"><div><h2>Creative momentum</h2><p>Board creation over time</p></div><select aria-label="Chart period" value={period} onChange={event => setPeriod(event.target.value)}><option value="6">Last 6 months</option><option value="12">Last 12 months</option></select></div>
        <div className="ai-chart-summary"><strong>{stats.months.reduce((sum, month) => sum + month.count, 0)}</strong><span>boards created in this period</span><span className="ai-chart-legend"><i /> New boards</span></div>
        <svg viewBox="0 0 600 200" role="img" aria-label={`New boards by month: ${stats.months.map(month => `${month.label}: ${month.count}`).join(", ")}`} className="ai-growth-chart"><defs><linearGradient id="admin-growth-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7b36" stopOpacity=".25" /><stop offset="100%" stopColor="#ff7b36" stopOpacity="0" /></linearGradient></defs>{[35, 77, 119, 160].map(y => <line key={y} x1="24" x2="576" y1={y} y2={y} stroke="#ffffff0d" strokeDasharray="4 5" />)}<polygon points={`24,160 ${points} 576,160`} fill="url(#admin-growth-fill)" /><polyline points={points} fill="none" stroke="#ff7b36" strokeWidth="2.5" strokeLinejoin="round" />{stats.months.map((month, index) => <g key={index}><circle cx={24 + index * 552 / Math.max(1, stats.months.length - 1)} cy={160 - month.count / maximum * 125} r="4" fill="#ff7b36" stroke="#222324" strokeWidth="2" /><text x={24 + index * 552 / Math.max(1, stats.months.length - 1)} y="188" textAnchor="middle" fill="#82858b" fontSize="10">{month.label}</text></g>)}</svg>
      </section>
      <section className="ai-panel ai-contributors"><div className="ai-panel-header"><div><h2>Team contribution</h2><p>Boards grouped by creator</p></div><Users size={17} /></div><div className="ai-owner-list">{stats.owners.slice(0, 5).map((owner, index) => <div className="ai-owner" key={index}><span className="ai-avatar" style={{ background: ["#463a2c", "#303e38", "#3b354c", "#303d4c", "#4c3438"][index] }}>{owner.name.slice(0, 2).toUpperCase()}</span><div><div><span>{owner.name}</span><strong>{owner.count}</strong></div><div className="ai-owner-track"><i style={{ width: `${owner.count / Math.max(1, stats.all.length) * 100}%` }} /></div></div></div>)}{!stats.owners.length && <p className="ai-empty">{boards === undefined ? "Loading contributors…" : "Your first board will start the story."}</p>}</div></section>
    </div>

    <div className="ai-bottom-grid">
      <section className="ai-panel ai-board-panel"><div className="ai-panel-header"><div><h2>Workspace boards <span className="ai-count">{stats.all.length}</span></h2><p>Manage the spaces where your team works</p></div><div className="ai-create"><NewBoardButton orgId={orgId} compact /></div></div><label className="ai-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search boards or owners…" aria-label="Search admin boards" /><kbd>Search</kbd></label><div className="ai-table-scroll"><table><thead><tr><th>Board name</th><th>Owner</th><th>Created</th><th>Starred</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredBoards.map(board => <tr key={board._id}><td><Link href={`/board/${board._id}`}><span className="ai-board-symbol"><LayoutDashboard size={14} /></span>{board.title}<ArrowUpRight size={12} /></Link></td><td>{board.authorName}</td><td>{new Date(board._creationTime).toLocaleDateString("en", { month: "short", day: "numeric" })}</td><td>{board.isFavourite ? <Star size={14} fill="currentColor" className="ai-star" /> : <span className="ai-muted">—</span>}</td><td><Actions id={board._id} title={board.title}><button aria-label={`Manage ${board.title}`} className="ai-row-menu"><MoreHorizontal size={17} /></button></Actions></td></tr>)}</tbody></table></div>{!filteredBoards.length && <p className="ai-empty">{boards === undefined ? "Loading your workspace…" : search ? "No boards match your search." : "Create a board to begin collaborating."}</p>}</section>
      <aside className="ai-panel ai-activity"><div className="ai-panel-header"><div><h2>Recent creations</h2><p>Latest workspace additions</p></div><Activity size={16} /></div>{stats.all.slice(0, 5).map(board => <Link key={board._id} href={`/board/${board._id}`} className="ai-activity-item"><span className="ai-activity-dot" /><div><strong>{board.title}</strong><p>Created by {board.authorName}</p><small>{new Date(board._creationTime).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</small></div><ArrowUpRight size={14} /></Link>)}{!stats.all.length && <p className="ai-empty">New boards will appear here.</p>}<Link href="/" className="ai-all-boards">View all boards <ArrowUpRight size={14} /></Link></aside>
    </div>
    <footer className="ai-footer"><span><BarChart3 size={13} /> Flowboard · Workspace intelligence</span><span>Built for your next big idea.</span></footer>
  </div>;
}
