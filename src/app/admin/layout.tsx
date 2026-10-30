import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Activity, BookOpen, ClipboardCheck, LayoutDashboard, PhoneOff, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Identity approvals", icon: ClipboardCheck },
  { href: "/admin/quizzes", label: "Quizzes", icon: BookOpen },
  { href: "/admin/students", label: "Student registry", icon: Users },
  { href: "/admin/missing-phones", label: "Missing phones", icon: PhoneOff },
];

async function ApprovalCount() {
  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("match_status", "pending_review");

  if (!count) return null;
  return <span className="min-w-6 rounded-full bg-amber-300 px-1.5 py-0.5 text-center text-[11px] font-bold text-emerald-950">{count}</span>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-slate-900 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-emerald-950/15 bg-[#064e3b] text-white lg:fixed lg:inset-y-0 lg:flex lg:w-[250px] lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10">
        <Link href="/admin" className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="grid size-10 place-items-center rounded-lg border border-emerald-100/20 bg-emerald-50/10"><Activity size={19} /></span>
          <span><span className="block text-sm font-semibold tracking-wide">Eilm Academy</span><span className="mt-0.5 block text-[11px] text-emerald-100/65">Administration</span></span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto px-3 py-4 lg:flex-1 lg:flex-col" aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-emerald-50/75 transition hover:bg-white/10 hover:text-white">
              <Icon size={17} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {href === "/admin/approvals" && <Suspense fallback={<span className="min-w-6" />}><ApprovalCount /></Suspense>}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 px-6 py-4 text-[11px] text-emerald-100/55 lg:block">Student &amp; quiz operations</div>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-5 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Operations console</p>
          <Link href="/student" className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Student portal <span aria-hidden="true">↗</span></Link>
        </header>
        {children}
      </div>
    </div>
  );
}