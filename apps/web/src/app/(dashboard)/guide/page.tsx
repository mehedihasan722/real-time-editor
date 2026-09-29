import Link from "next/link";
const sections = [
  { title: "1. Set up your workspace", body: "Sign in, create or join an organization, and choose it from the left sidebar. The organization keeps your team's boards together." },
  { title: "2. Create a board", body: "Choose Blank board or a starter template. On an empty board, describe a goal in Flowboard Assist or use a quick suggestion. The validated prompt becomes a collaborative heading plus editable goal, planning, and action notes." },
  { title: "3. Use the canvas", body: "Select items to move or resize them. Sticky notes use a spacious FigJam-inspired layout with author, typeface, size, bold, strike, link, and list controls. The drawing palette provides pen, marker, styled strokes, eraser, widths, and colors. Shapes & Lines, Frames, and Stickers each open a focused insertion sidebar." },
  { title: "4. Edit and organize", body: "Click a board title to rename it. Use the star in the board header to add or remove it from Favourite boards. The board menu copies links or deletes boards. Select an item and press Delete or Backspace to remove it; Ctrl/Cmd+Z undoes a change." },
  { title: "5. Collaborate live", body: "Use Share on the board to copy its link for an organization teammate. When they open the same board, their cursors, selections, edits, and starter content appear live. A network connection and organization access are required." },
  { title: "6. Manage the organization", body: "Organization admins can open the Admin dashboard to review board creation, ownership, and board controls. Counts reflect current board records; they are not user-session analytics." },
  { title: "7. Install the app", body: "On a supported mobile or desktop browser, use Install app or Add to Home Screen from the browser menu. Boards still need an internet connection." },
  { title: "8. Personalize Flowboard", body: "Open Settings to choose Light, Dark, or System appearance. Canvas preferences control the grid, contrast, and motion. The plus button opens a searchable Tools and Marketplace catalog. In Diagram & Shapes, click a +N shapes control to reveal exactly N insertable shapes from that pack." },
];
export default function GuidePage() {
  return <div className="px-6 pb-10 max-w-[1050px]">
    <p className="text-xs uppercase tracking-[.2em] font-bold text-[#5368b8]">Help center</p><h1 className="text-3xl font-bold mt-1">Flowboard guide</h1><p className="text-sm text-slate-500 mt-2 mb-7">Everything you need to get started and work with your team.</p>
    <div className="grid md:grid-cols-2 gap-4">{sections.map(section => <section key={section.title} className="admin-panel"><h2>{section.title}</h2><p className="text-sm text-slate-600 mt-3 leading-6">{section.body}</p></section>)}</div>
    <div className="mt-6 flex gap-3"><Link href="/templates" className="rounded-md bg-[#4262ff] px-4 py-2 text-white font-semibold text-sm">Explore templates</Link><Link href="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Go to boards</Link></div>
  </div>;
}
