"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";

type Student = { student_id: string; name: string; phone: string | null; normalized_phone: string | null; status: string; city: string | null; quizzesTaken: number; averageScore: number | null };

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Student[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/admin/students?q=${encodeURIComponent(query)}`, { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to load registry"); setItems(result.items ?? []); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load registry")).finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  return <main className="mx-auto max-w-[1300px] px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 border-b border-slate-200 pb-5"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Master registrations</p><h1 className="mt-1 text-2xl font-semibold">Student registry</h1><p className="mt-1 text-sm text-slate-500">Search registered students and review quiz participation.</p></div>
    <section className="border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Users size={16} className="text-emerald-700" />{items.length} students shown</h2><label className="relative w-full sm:max-w-sm"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, QUR-ID or phone" className="w-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700" /></label></div>
      {error && <p role="alert" className="px-5 py-3 text-sm text-rose-700">{error}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Quizzes taken</th><th className="px-5 py-3">Average score</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((student) => <tr key={student.student_id}><td className="px-5 py-4"><p className="text-sm font-semibold">{student.name}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{student.student_id}</p></td><td className="px-4 py-4 text-xs text-slate-600">{student.normalized_phone ?? student.phone ?? "Not provided"}</td><td className="px-4 py-4 text-xs text-slate-600">{student.city ?? "-"}</td><td className="px-4 py-4 text-sm tabular-nums">{student.quizzesTaken}</td><td className="px-5 py-4 text-sm tabular-nums">{student.averageScore ?? "-"}</td></tr>)}</tbody></table>{!loading && items.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">No matching students.</p>}{loading && <p className="px-5 py-3 text-xs text-slate-400">Updating results…</p>}</div>
    </section></main>;
}