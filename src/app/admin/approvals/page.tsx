import ApprovalsQueue from "@/components/admin/ApprovalsQueue";

export default function ApprovalsPage() {
  return <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">
    <div className="mb-6 flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Identity resolution</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Approval queue</h1><p className="mt-1 text-sm text-slate-500">Resolve uncertain submissions and retain approved identity aliases.</p></div><span className="text-xs text-slate-500">Changes are recorded against the original submission</span></div>
    <ApprovalsQueue />
  </main>;
}