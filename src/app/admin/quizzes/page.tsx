"use client";

import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle, RefreshCw } from "lucide-react";

type Quiz = { id: string | number; title: string; status: string; last_synced_at: string | null; submissions: number };

export default function QuizzesPage() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | number | null>(null);
  async function load() {
    const response = await fetch("/api/admin/quizzes", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Unable to load quizzes");
    setItems(result.items ?? []);
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load quizzes")); }, 0); return () => window.clearTimeout(timer); }, []);
  async function toggle(quiz: Quiz) {
    setBusy(quiz.id); setError("");
    try {
      const response = await fetch("/api/admin/quizzes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: quiz.id, status: quiz.status === "active" ? "inactive" : "active" }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Status update failed");
      setItems((current) => current.map((item) => item.id === quiz.id ? { ...item, status: result.item.status } : item));
    } catch (e) { setError(e instanceof Error ? e.message : "Status update failed"); } finally { setBusy(null); }
  }
  return <main className="mx-auto max-w-[1300px] px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 border-b border-slate-200 pb-5"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Assessment operations</p><h1 className="mt-1 text-2xl font-semibold">Quiz manager</h1><p className="mt-1 text-sm text-slate-500">Review synced sheets and control which quizzes are active.</p></div>
    {error && <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
    <section className="border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-emerald-700" />{items.length} synced quizzes</h2><button type="button" title="Refresh quizzes" aria-label="Refresh quizzes" onClick={() => void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load quizzes"))} className="p-2 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Quiz</th><th className="px-4 py-3">Submissions</th><th className="px-4 py-3">Last sync</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Control</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((quiz) => <tr key={quiz.id}><td className="px-5 py-4"><p className="text-sm font-semibold">{quiz.title}</p><p className="mt-1 text-xs text-slate-500">Quiz #{quiz.id}</p></td><td className="px-4 py-4 text-sm tabular-nums">{quiz.submissions}</td><td className="px-4 py-4 text-xs text-slate-600">{quiz.last_synced_at ? new Date(quiz.last_synced_at).toLocaleString() : "Not recorded"}</td><td className="px-4 py-4"><span className={`border px-2 py-1 text-[10px] font-semibold ${quiz.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{quiz.status}</span></td><td className="px-5 py-4 text-right"><button type="button" disabled={busy === quiz.id} onClick={() => void toggle(quiz)} className="border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">{busy === quiz.id ? <LoaderCircle size={14} className="animate-spin" /> : quiz.status === "active" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></section>
  </main>;
}