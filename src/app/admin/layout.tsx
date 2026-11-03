import type { ReactNode } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import AddQuizModal from "@/components/AddQuizModal";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-900">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin" aria-label="Eilm Academy Admin home" className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-800 text-white">
            <Activity size={18} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-slate-900">Eilm Academy Admin</p>
            <Link href="/admin" className="text-xs text-slate-500 hover:text-emerald-800">Dashboard &amp; Analytics</Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/student" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Link to Student Portal <span aria-hidden="true">↗</span></Link>
          <AddQuizModal />
        </div>
      </header>
      {children}
    </div>
  );
}