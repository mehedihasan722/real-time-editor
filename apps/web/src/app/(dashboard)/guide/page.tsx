import Link from "next/link";
const sections = [
  { title: "1. Set up your workspace", body: "Sign in, create or join an organization, and choose it from the left sidebar. The organization keeps your team's boards together." },
  { title: "2. Create a board", body: "Choose Blank board or a starter template. Templates add editable notes and a heading to a new board; you can change or remove everything." },
  { title: "3. Use the canvas", body: "Select items to move or resize them. Use the toolbar for text, sticky notes, rectangles, ellipses, and the pen. Scroll to pan around the canvas." },
  { title: "4. Edit and organize", body: "Click a board title to rename it. Use the board menu to copy a link or delete the board. Select an item and press Delete or Backspace to remove it; Ctrl/Cmd+Z undoes a change." },
  { title: "5. Collaborate live", body: "Invite teammates from the workspace header. When they open the same board, their cursors and selections appear on the canvas. A network connection is required." },
  { title: "6. Manage the organization", body: "Organization admins can open the Admin dashboard to review board creation, ownership, and board controls. Counts reflect current board records; they are not user-session analytics." },
  { title: "7. Install the app", body: "On a supported mobile or desktop browser, use Install app or Add to Home Screen from the browser menu. Boards still need an internet connection." },
];
export default function GuidePage() {
  return <div className="px-6 pb-10 max-w-[1050px]">
    <p className="text-xs uppercase tracking-[.2em] font-bold text-[#5368b8]">Help center</p><h1 className="text-3xl font-bold mt-1">Flowboard guide</h1><p className="text-sm text-slate-500 mt-2 mb-7">Everything you need to get started and work with your team.</p>
    <div className="grid md:grid-cols-2 gap-4">{sections.map(section => <section key={section.title} className="admin-panel"><h2>{section.title}</h2><p className="text-sm text-slate-600 mt-3 leading-6">{section.body}</p></section>)}</div>
    <div className="mt-6 flex gap-3"><Link href="/templates" className="rounded-md bg-[#4262ff] px-4 py-2 text-white font-semibold text-sm">Explore templates</Link><Link href="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Go to boards</Link></div>
  </div>;
}
