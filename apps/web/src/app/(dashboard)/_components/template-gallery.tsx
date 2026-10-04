"use client";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Workflow, ListTodo, Map, LayoutGrid, Sparkles, PenTool, FileText, CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";
const ThreeTemplatePreview = dynamic(() => import("./three-template-preview"), { ssr: false });

const templates = [
  { name: "AI Playground", icon: Sparkles, style: "bg-[#ece9ff]", three: true },
  { name: "Retrospective", icon: LayoutGrid, style: "bg-[#ffebe8]" },
  { name: "Flowchart", icon: Workflow, style: "bg-[#e7f2ff]" },
  { name: "To-do planning", icon: ListTodo, style: "bg-[#e4f4ec]" },
  { name: "Roadmap", icon: Map, style: "bg-[#fff0d7]" },
  { name: "Weekly update", icon: CalendarDays, style: "bg-[#eaf0ff]" },
  { name: "Prototype", icon: PenTool, style: "bg-[#ffe9f5]" },
  { name: "Product requirements", icon: FileText, style: "bg-[#e7f5f2]" },
];

export default function TemplateGallery({ orgId }: { orgId: string }) {
  const router = useRouter();
  const { mutate, pending } = useApiMutation(api.board.create);
  const create = (title: string) => mutate({ orgId, title }).then(id => { toast.success("Board created"); router.push(title === "Untitled board" ? `/board/${id}` : `/board/${id}?template=${encodeURIComponent(title)}`); }).catch(() => toast.error("Failed to create board"));
  return <section className="rounded-xl border border-slate-200 bg-[#f4f6fa] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 p-5 md:p-6 mb-8">
    <div className="flex items-center justify-between mb-5"><h2 className="font-semibold text-[15px] text-[#252936] dark:text-slate-100">Start with a board</h2><span className="text-xs text-slate-500 dark:text-slate-400">Choose a starting point</span></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
      <button disabled={pending} onClick={() => create("Untitled board")} className="text-left group text-slate-700 dark:text-slate-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"><div className="h-24 rounded-xl border border-[#d9deea] dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center group-hover:border-[#4262ff] transition-colors"><Plus className="h-7 w-7 text-slate-700 dark:text-slate-200" /></div><span className="block mt-2 text-xs font-medium">Blank board</span></button>
      {templates.map(({ name, icon: Icon, style, three }) => <button key={name} disabled={pending} onClick={() => create(name)} className="text-left group text-slate-700 dark:text-slate-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"><div className={`h-24 rounded-xl border border-[#d9deea] dark:border-slate-600 ${style} flex items-center justify-center overflow-hidden group-hover:border-[#4262ff] transition-colors`}>{three ? <ThreeTemplatePreview /> : <Icon className="h-9 w-9 text-[#4c5b82] stroke-[1.25]" />}</div><span className="block mt-2 text-xs font-medium truncate">{name}</span></button>)}
    </div>
  </section>;
}
