"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search, UserRound, UserRoundX } from "lucide-react";

type Student = { student_id: string; name: string; phone: string | null; normalized_phone: string | null };
type Submission = { id: number; quiz_id: string | number; timestamp: string; typed_name: string | null; phone: string | null; normalized_phone: string | null; score: number | null; quizzes: { title: string } | { title: string }[] | null };

function quizTitle(value: Submission["quizzes"]) {
  return Array.isArray(value) ? value[0]?.title : value?.title;
}

export default function ApprovalsQueue() {
  const [items, setItems] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selections, setSelections] = useState<Record<number, Student>>({});
  const [searches, setSearches] = useState<Record<number, string>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/approvals", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load approval queue");
      setItems(result.items ?? []);
      setStudents(result.students ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load approval queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function decide(item: Submission, decision: "approve" | "external") {
    if (decision === "approve" && !selections[item.id]) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/approvals/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: item.id, decision, studentId: selections[item.id]?.student_id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to resolve submission");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(decision === "approve" ? `Submission #${item.id} matched and alias saved.` : `Submission #${item.id} marked as external.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to resolve submission");
    } finally {
      setBusyId(null);
      setOpenId(null);
    }
  }

  if (loading) return <div className="grid min-h-56 place-items-center border border-slate-200 bg-white text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading approvals</div>;

  return <section className="border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-900">Pending identity review</h2><p className="mt-1 text-xs text-slate-500">{items.length} {items.length === 1 ? "submission" : "submissions"} currently need a decision</p></div><button type="button" onClick={() => void load()} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Refresh queue</button></div>
    {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</div>}
    {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">{notice}</div>}
    {items.length === 0 ? <div className="grid min-h-64 place-items-center px-6 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check size={20} /></span><p className="mt-3 text-sm font-semibold text-slate-800">Queue is clear</p><p className="mt-1 text-xs text-slate-500">New submissions requiring identity review will appear here.</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left"><thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Submission</th><th className="px-4 py-3">Quiz</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Typed name</th><th className="px-4 py-3">Phone input</th><th className="px-4 py-3">Score</th><th className="min-w-[290px] px-4 py-3">Registered student</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => {
      const needle = (searches[item.id] ?? "").trim().toLowerCase();
      const candidates = students.filter((student) => !needle || [student.student_id, student.name, student.phone, student.normalized_phone].some((value) => value?.toLowerCase().includes(needle))).slice(0, 6);
      const selected = selections[item.id];
      return <tr key={item.id} className="align-top hover:bg-slate-50/60">
        <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-700">#{item.id}</td>
        <td className="px-4 py-4"><span className="text-xs font-semibold text-slate-800">{quizTitle(item.quizzes) ?? `Quiz ${item.quiz_id}`}</span><span className="mt-1 block text-[11px] text-slate-400">#{item.quiz_id}</span></td>
        <td className="px-4 py-4 text-xs text-slate-600">{new Date(item.timestamp).toLocaleString()}</td>
        <td className="max-w-[180px] px-4 py-4 text-xs font-medium text-slate-800">{item.typed_name || <span className="italic text-slate-400">No name</span>}</td>
        <td className="px-4 py-4 text-xs"><span className="block text-slate-700">{item.phone || "No phone"}</span><span className="mt-1 block text-[11px] text-slate-400">{item.normalized_phone ?? "Not normalized"}</span></td>
        <td className="px-4 py-4 text-xs tabular-nums text-slate-700">{item.score ?? "-"}</td>
        <td className="px-4 py-3"><div className="relative"><div className="flex items-center border border-slate-300 bg-white focus-within:border-emerald-700"><Search size={14} className="ml-2.5 shrink-0 text-slate-400" /><input value={selected ? `${selected.name} · ${selected.student_id}` : searches[item.id] ?? ""} onChange={(event) => { setSelections((current) => { const next = { ...current }; delete next[item.id]; return next; }); setSearches((current) => ({ ...current, [item.id]: event.target.value })); setOpenId(item.id); }} onFocus={() => setOpenId(item.id)} placeholder="Search ID, name or phone" aria-label={`Find student for submission ${item.id}`} className="w-full min-w-0 px-2 py-2 text-xs outline-none" /><ChevronDown size={14} className="mr-2 text-slate-400" /></div>{openId === item.id && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-slate-200 bg-white shadow-lg">{candidates.map((student) => <button key={student.student_id} type="button" onClick={() => { setSelections((current) => ({ ...current, [item.id]: student })); setSearches((current) => ({ ...current, [item.id]: "" })); setOpenId(null); }} className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-emerald-50"><span className="flex items-center gap-2 text-xs font-semibold text-slate-800"><UserRound size={13} className="text-emerald-700" />{student.name}<span className="font-mono text-[10px] text-slate-500">{student.student_id}</span></span><span className="ml-5 mt-1 block text-[10px] text-slate-500">{student.normalized_phone ?? student.phone ?? "No registered phone"}</span></button>)}{candidates.length === 0 && <p className="px-3 py-3 text-xs text-slate-500">No matching registration found</p>}</div>}</div>{selected && <p className="mt-1.5 text-[10px] font-medium text-emerald-800">Alias will be remembered for future matching</p>}</td>
        <td className="px-4 py-3"><div className="flex min-w-[140px] flex-col gap-1.5"><button type="button" disabled={!selected || busyId === item.id} onClick={() => void decide(item, "approve")} className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{busyId === item.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}Approve &amp; remember</button><button type="button" disabled={busyId === item.id} onClick={() => void decide(item, "external")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><UserRoundX size={13} />Mark external</button></div></td>
      </tr>;
    })}</tbody></table></div>}
  </section>;
}