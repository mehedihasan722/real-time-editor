"use client";
import { useOrganization } from "@clerk/nextjs";
import TemplateGallery from "../_components/template-gallery";
import Link from "next/link";

export default function TemplatesPage() {
  const { organization } = useOrganization();
  return <div className="px-6 pb-10 max-w-[1500px]">
    <div className="mb-7"><p className="text-xs uppercase tracking-[.2em] font-bold text-[#5368b8]">A faster start</p><h1 className="text-3xl font-bold mt-1">Explore templates</h1><p className="text-sm text-slate-500 mt-2">Choose a board to create a collaborative starting point with editable content.</p></div>
    {organization ? <TemplateGallery orgId={organization.id} /> : <p className="admin-panel">Create or select an organization to use templates.</p>}
    <div className="admin-panel"><h2>Make it yours</h2><p className="text-sm text-slate-600 mt-2">Each template starts with editable notes and a heading. Add shapes, text, and freehand drawing from the board toolbar. Your team can work together in real time.</p><Link href="/guide" className="inline-block mt-4 text-[#4262ff] font-semibold text-sm">Read the full guide</Link></div>
  </div>;
}
