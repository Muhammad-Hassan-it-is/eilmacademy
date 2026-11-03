import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ChartNoAxesCombined } from "lucide-react";
import AddQuizModal from "@/components/AddQuizModal";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-900 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-emerald-950/15 bg-[#064e3b] text-white lg:fixed lg:inset-y-0 lg:flex lg:w-[250px] lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10">
        <Link href="/admin" className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="grid size-10 place-items-center rounded-lg border border-emerald-100/20 bg-emerald-50/10"><Activity size={19} /></span>
          <span className="text-sm font-semibold tracking-wide">Eilm Academy Admin</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto px-3 py-4 lg:flex-1 lg:flex-col" aria-label="Admin navigation">
          <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-emerald-50/90 transition hover:bg-white/10 hover:text-white">
            <ChartNoAxesCombined size={17} strokeWidth={1.8} />
            <span>Dashboard &amp; Analytics</span>
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-5 sm:px-8">
          <Link href="/student" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Link to Student Portal <span aria-hidden="true">↗</span></Link>
          <AddQuizModal />
        </header>
        {children}
      </div>
    </div>
  );
}