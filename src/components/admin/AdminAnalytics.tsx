"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AdminQuiz {
  id: string | number;
  title: string;
  spreadsheet_id: string;
  tab_gid: number;
  status: string;
  submissions: number;
}

export interface AnalyticsSubmission {
  quiz_id: string | number;
  score: number | null;
  match_status: string;
  phone: string | null;
  normalized_phone: string | null;
}

export interface AnalyticsData {
  totalSubmissions: number;
  matchedSubmissions: number;
  pendingReview: number;
  activeQuizzes: number;
  quizzes: AdminQuiz[];
  trend: { quiz: string; participants: number; averageScore: number | null }[];
  regions: { pakistan: number; international: number };
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export default function AdminAnalytics({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = useState(initialData);
  const [busyQuiz, setBusyQuiz] = useState<string | null>(null);
  const [error, setError] = useState("");

  const matchRate = data.totalSubmissions
    ? Math.round((data.matchedSubmissions / data.totalSubmissions) * 100)
    : 0;
  const identifiedSubmissions = data.regions.pakistan + data.regions.international;

  async function toggleQuiz(quiz: AdminQuiz) {
    const status = quiz.status === "active" ? "inactive" : "active";
    setBusyQuiz(String(quiz.id));
    setError("");

    try {
      const response = await fetch(`/api/admin/quizzes/${encodeURIComponent(String(quiz.id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Quiz status could not be updated");

      setData((current) => ({
        ...current,
        activeQuizzes: current.activeQuizzes + (status === "active" ? 1 : -1),
        quizzes: current.quizzes.map((item) =>
          item.id === quiz.id ? { ...item, status: result.item.status } : item,
        ),
      }));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Quiz status could not be updated");
    } finally {
      setBusyQuiz(null);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">View Analytics</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Admin dashboard</h1>
      </header>

      {error && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <section aria-label="Core metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Synced Quizzes" value={data.activeQuizzes.toLocaleString()} detail="Active quiz sheets" />
        <MetricCard label="Total Submissions" value={data.totalSubmissions.toLocaleString()} detail="Recorded student responses" />
        <MetricCard label="Successfully Matched" value={`${data.matchedSubmissions.toLocaleString()} · ${matchRate}%`} detail="Of all submissions" />
        <MetricCard label="Action Needed" value={data.pendingReview.toLocaleString()} detail="Pending review" />
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <article className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Participation &amp; Average Score Trend</h2>
            <p className="mt-1 text-xs text-slate-500">Submissions and average score (/10 or /20) by quiz</p>
          </div>
          <div className="h-[310px] p-3">
            {data.trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.trend} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eeea" vertical={false} />
                  <XAxis dataKey="quiz" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="participants" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis yAxisId="score" orientation="right" domain={[0, 20]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ border: "1px solid #dbe4de", borderRadius: 8, fontSize: 12 }} />
                  <Bar yAxisId="participants" dataKey="participants" name="Submissions" fill="#047857" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="score" type="monotone" dataKey="averageScore" name="Average score" stroke="#c2410c" strokeWidth={2} dot={{ r: 2, fill: "#c2410c" }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <p className="grid h-full place-items-center text-sm text-slate-500">No quiz data available yet.</p>}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Student Breakdown</h2>
            <p className="mt-1 text-xs text-slate-500">Submission phone regions</p>
          </div>
          <div className="space-y-5 p-5">
            {([
              ["Pakistan (+92)", data.regions.pakistan],
              ["International", data.regions.international],
            ] as const).map(([label, count]) => {
              const share = identifiedSubmissions ? Math.round((count / identifiedSubmissions) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">{count.toLocaleString()} <span className="font-normal text-slate-400">({share}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-700" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
              Based on {identifiedSubmissions.toLocaleString()} submissions with a phone number.
            </p>
          </div>
        </article>
      </section>

      <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Quizzes</h2>
          <p className="mt-1 text-xs text-slate-500">Manage linked sheets and quiz availability.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Quiz ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Sheet Link</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.quizzes.map((quiz) => {
                const isActive = quiz.status === "active";
                const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(quiz.spreadsheet_id)}/edit#gid=${quiz.tab_gid}`;
                return (
                  <tr key={quiz.id}>
                    <td className="px-5 py-4 text-sm font-medium tabular-nums text-slate-700">{quiz.id}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{quiz.title}</td>
                    <td className="px-4 py-4"><a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-800 hover:underline">Open sheet ↗</a></td>
                    <td className="px-4 py-4 text-sm tabular-nums text-slate-600">{quiz.submissions.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        aria-label={`${isActive ? "Deactivate" : "Activate"} quiz ${quiz.id}`}
                        disabled={busyQuiz === String(quiz.id)}
                        onClick={() => void toggleQuiz(quiz)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${isActive ? "bg-emerald-700" : "bg-slate-300"}`}
                      >
                        <span className={`inline-block size-4 rounded-full bg-white transition ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                      <span className="ml-2 text-xs font-medium text-slate-600">{isActive ? "Active" : "Inactive"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data.quizzes.length && <p className="px-5 py-10 text-center text-sm text-slate-500">No quizzes added yet.</p>}
        </div>
      </section>
    </main>
  );
}
