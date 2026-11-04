"use client";

import { ArrowLeft, Check, Clock3, ExternalLink, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type Results = {
  student: { student_id: string; name: string; phone: string | null; city: string | null };
  total_quizzes: number;
  average_score: number;
  quizzes: {
    quiz_id: string;
    quiz_title: string;
    quiz_url: string | null;
    max_marks: number | null;
    score: number | null;
    timestamp: string | null;
  }[];
};

const countryCodes = [
  { value: "+92", label: "🇵🇰 Pakistan (+92)" },
  { value: "+966", label: "🇸🇦 Saudi Arabia (+966)" },
  { value: "+971", label: "🇦🇪 UAE (+971)" },
  { value: "+44", label: "🇬🇧 United Kingdom (+44)" },
  { value: "+1", label: "🇺🇸 United States / Canada (+1)" },
  { value: "+974", label: "🇶🇦 Qatar (+974)" },
  { value: "+965", label: "🇰🇼 Kuwait (+965)" },
  { value: "+968", label: "🇴🇲 Oman (+968)" },
  { value: "+973", label: "🇧🇭 Bahrain (+973)" },
  { value: "+91", label: "🇮🇳 India (+91)" },
  { value: "+61", label: "🇦🇺 Australia (+61)" },
  { value: "+60", label: "🇲🇾 Malaysia (+60)" },
  { value: "+27", label: "🇿🇦 South Africa (+27)" },
  { value: "+31", label: "🇳🇱 Netherlands (+31)" },
  { value: "+34", label: "🇪🇸 Spain (+34)" },
];

export default function StudentPage() {
  const [query, setQuery] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredQuery = query.trim();
    const isPhoneQuery = /^[+\d\s().-]+$/.test(enteredQuery);
    let lookupQuery = enteredQuery;

    if (isPhoneQuery && enteredQuery.startsWith("+")) {
      lookupQuery = enteredQuery.replace(/[^+\d]/g, "");
    } else if (isPhoneQuery && countryCode === "other") {
      setError("Enter the full phone number beginning with + for Other / Custom.");
      return;
    } else if (isPhoneQuery) {
      const nationalNumber = enteredQuery.replace(/\D/g, "").replace(/^0+/, "");
      lookupQuery = `${countryCode}${nationalNumber}`;
    }

    setLoading(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/student/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lookupQuery }),
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
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-800"><ArrowLeft size={16} /> Eilm Academy</Link>
        <header className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Student portal</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your quiz results</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">View your quiz links, scores, and completion status. Search with the phone number or registered name used for your submissions.</p>
        </header>

        <form onSubmit={findResults} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:flex sm:items-center sm:gap-3 sm:p-4">
          <div className="flex min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#fbfaf6] transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
            <select aria-label="Country calling code" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-[138px] shrink-0 rounded-l-xl border-r border-slate-200 bg-transparent px-2 py-3 text-xs font-semibold text-slate-700 outline-none sm:w-[190px] sm:px-3 sm:text-sm">
              {countryCodes.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
              <option disabled>──────────</option>
              <option value="other">Other / Custom</option>
            </select>
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-3.5 text-slate-400" />
              <input type="tel" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Phone number or registered name" aria-label="Phone number or registered name" className="w-full min-w-0 rounded-r-xl bg-transparent py-3 pl-9 pr-9 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" title="Clear search" className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"><X size={15} /></button>}
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60 sm:mt-0 sm:w-auto">{loading ? "Loading..." : "View Results"}</button>
        </form>

        {error && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800"><p className="font-semibold">No results found</p><p className="mt-1 text-amber-700">{error}. Check the spelling or phone number and try again.</p></div>}

        {results && <section className="mt-8 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Student profile</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{results.student.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{results.student.student_id}{results.student.city ? ` · ${results.student.city}` : ""}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800"><UserRound size={22} /></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <Stat label="Registered number" value={results.student.phone ?? "Not available"} />
              <Stat label="Quizzes completed" value={String(results.total_quizzes)} />
              <Stat label="Average score" value={`${results.average_score}%`} />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Quiz progress</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest quizzes appear first.</p>
            </div>
            {results.quizzes.length ? (
              <div>
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                      <th className="w-[28%] px-2 py-3 sm:px-5">Quiz no.</th>
                      <th className="w-[40%] px-2 py-3 sm:px-4">Quiz link / marks</th>
                      <th className="w-[32%] px-2 py-3 sm:px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.quizzes.map((quiz) => {
                      const completed = quiz.timestamp !== null;
                      return (
                        <tr key={quiz.quiz_id} className="hover:bg-slate-50/70">
                          <td className="px-2 py-4 sm:px-5">
                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">Quiz {quiz.quiz_id}</p>
                          </td>
                          <td className="break-words px-2 py-4 text-xs sm:px-4 sm:text-sm">
                            {completed ? (
                              <span className="font-semibold tabular-nums text-slate-800">
                                {quiz.score ?? "Score unavailable"}{quiz.score !== null && quiz.max_marks !== null ? ` / ${quiz.max_marks}` : ""}
                              </span>
                            ) : quiz.quiz_url ? (
                              <a href={quiz.quiz_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline sm:gap-1.5">
                                Open quiz <ExternalLink size={14} />
                              </a>
                            ) : <span className="text-slate-400">Link unavailable</span>}
                          </td>
                          <td className="px-2 py-4 sm:px-5">
                            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1 text-[10px] font-semibold sm:gap-1.5 sm:px-2.5 sm:text-xs ${completed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                              {completed ? <Check aria-hidden="true" className="hidden sm:block" size={12} /> : <Clock3 aria-hidden="true" className="hidden sm:block" size={12} />}
                              {completed ? "Completed" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="px-5 py-8 text-center text-sm text-slate-500">No active quizzes are available right now.</p>}
          </div>
        </section>}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p></div>;
}