"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, PhoneOff, Search } from "lucide-react";

type Student = { student_id: string; name: string; phone: string | null; normalized_phone: string | null };
type Submission = { id: number; quiz_id: string | number; timestamp: string; typed_name: string | null; phone: string | null; score: number | null };

function normalizedName(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

export default function MissingPhonesPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Record<number, Student>>({});
  const [query, setQuery] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetch("/api/admin/missing-phones", { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to load triage queue"); setItems(result.items ?? []); setStudents(result.students ?? []); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load triage queue")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const visible = useMemo(() => items.filter((item) => (item.typed_name ?? "").toLowerCase().includes(search.toLowerCase())), [items, search]);
  async function link(item: Submission) {
    const student = selection[item.id]; if (!student) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/admin/missing-phones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: item.id, studentId: student.student_id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to link submission");
      setItems((current) => current.filter((entry) => entry.id !== item.id)); setNotice(`Submission #${item.id} linked to ${student.student_id}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to link submission"); } finally { setBusy(null); }
  }
  return <main className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 border-b border-slate-200 pb-5"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Phone triage</p><h1 className="mt-1 text-2xl font-semibold">Missing phone submissions</h1><p className="mt-1 text-sm text-slate-500">Review name-based registration suggestions before linking an identity.</p></div>
    {error && <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}{notice && <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <section className="border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><PhoneOff size={16} className="text-amber-700" />{items.length} responses need phone review</h2><p className="mt-1 text-xs text-slate-500">Suggestions use normalized-name similarity; confirm before linking.</p></div><label className="relative w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter by submitted name" className="w-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700" /></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Submission</th><th className="px-4 py-3">Typed name</th><th className="px-4 py-3">Quiz</th><th className="min-w-[320px] px-4 py-3">Suggested registration</th><th className="px-5 py-3">Link</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => {
        const name = normalizedName(item.typed_name ?? "");
        const input = (query[item.id] ?? "").toLowerCase();
        const suggestions = students.map((student) => ({ student, score: normalizedName(student.name) === name ? 3 : normalizedName(student.name).includes(name) || name.includes(normalizedName(student.name)) ? 2 : 0 })).filter(({ student, score }) => score > 0 || (input && [student.student_id, student.name, student.phone, student.normalized_phone].some((value) => value?.toLowerCase().includes(input)))).sort((a, b) => b.score - a.score).slice(0, 7).map(({ student }) => student);
        const selected = selection[item.id];
        return <tr key={item.id} className="align-top"><td className="px-5 py-4 font-mono text-xs">#{item.id}</td><td className="px-4 py-4 text-sm font-medium">{item.typed_name || "Unnamed response"}<span className="mt-1 block text-[11px] font-normal text-slate-400">{new Date(item.timestamp).toLocaleString()}</span></td><td className="px-4 py-4 text-xs text-slate-600">Quiz #{item.quiz_id}</td><td className="px-4 py-3"><input value={selected ? `${selected.name} · ${selected.student_id}` : query[item.id] ?? ""} onChange={(event) => { setSelection((current) => { const next = { ...current }; delete next[item.id]; return next; }); setQuery((current) => ({ ...current, [item.id]: event.target.value })); }} placeholder="Search suggestions by name, ID, phone" className="w-full border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-700" />{!selected && <div className="mt-1 border border-slate-100">{suggestions.map((student) => <button key={student.student_id} type="button" onClick={() => setSelection((current) => ({ ...current, [item.id]: student }))} className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-0 hover:bg-emerald-50"><span className="font-medium text-slate-800">{student.name} <span className="font-mono text-[10px] text-slate-500">{student.student_id}</span></span><span className="text-[10px] text-slate-500">{student.normalized_phone ?? student.phone ?? "No phone"}</span></button>)}</div>}</td><td className="px-5 py-3"><button type="button" disabled={!selected || busy === item.id} onClick={() => void link(item)} className="inline-flex items-center gap-1.5 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40">{busy === item.id ? "Linking…" : <><Check size={13} />Link student</>}</button></td></tr>;
      })}</tbody></table>{visible.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">No missing-phone submissions match this search.</p>}</div>
    </section></main>;
}