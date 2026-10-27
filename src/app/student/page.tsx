"use client";

import { ArrowLeft, CalendarDays, Search, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Results = {
  student: { student_id: string; name: string; phone: string | null; city: string | null };
  total_quizzes: number;
  total_score: number;
  average_score: number;
  quizzes: { quiz_id: string; quiz_title: string; score: number | null; timestamp: string }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function StudentPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/student/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Results could not be loaded");
      setResults(data);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Results could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700"><ArrowLeft size={16} /> Admin dashboard</Link>
        <header className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Student portal</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your quiz results</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Search with the phone number or registered name used for your quiz submissions.</p>
        </header>

        <form onSubmit={findResults} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:flex sm:items-center sm:gap-3 sm:p-4">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter your phone number (e.g. 03001234567) or registered name" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></div>
          <button type="submit" disabled={loading} className="mt-3 w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60 sm:mt-0 sm:w-auto">{loading ? "Loading..." : "View Results"}</button>
        </form>

        {error && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800"><p className="font-semibold">No results found</p><p className="mt-1 text-amber-700">{error}. Check the spelling or phone number and try again.</p></div>}

        {results && <section className="mt-8 space-y-5">
          <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-[0_12px_30px_rgba(15,23,42,0.15)]"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">Student</p><h2 className="mt-1 text-2xl font-semibold">{results.student.name}</h2><p className="mt-2 text-sm text-slate-400">{results.student.student_id}{results.student.city ? ` · ${results.student.city}` : ""}</p></div><div className="rounded-xl bg-teal-500/15 p-3 text-teal-300"><UserRound size={22} /></div></div><div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4"><Stat label="Registered number" value={results.student.phone ?? "Not available"} /><Stat label="Quizzes completed" value={String(results.total_quizzes)} /><Stat label="Total score" value={String(results.total_score)} /><Stat label="Average score" value={String(results.average_score)} /></div></div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Quiz scores</h2></div>{results.quizzes.length ? <div className="divide-y divide-slate-100">{results.quizzes.map((quiz) => <div key={`${quiz.quiz_id}-${quiz.timestamp}`} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-teal-50 p-2 text-teal-700"><Trophy size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{quiz.quiz_title}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={12} /> {formatDate(quiz.timestamp)}</p></div></div><span className="shrink-0 text-lg font-bold text-teal-700">{quiz.score ?? "-"}</span></div>)}</div> : <p className="px-5 py-8 text-center text-sm text-slate-500">No quiz submissions have been recorded yet.</p>}</div>
        </section>}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="truncate text-[11px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</p></div>;
}