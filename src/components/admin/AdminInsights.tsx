"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Globe2, RefreshCw } from "lucide-react";
import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type DashboardData = {
  metrics: { activeQuizzes: number; totalSubmissions: number; matched: number; pendingReview: number; matchRate: number; identifiableMatchRate: number; internationalStudents: number };
  quizTrend: { quiz: string; participants: number; averageScore: number | null }[];
  demographics: { name: string; value: number }[];
  matchHealth: { name: string; value: number; fill: string }[];
  recent: { id: number; quiz_id: string | number; timestamp: string; typed_name: string | null; score: number | null; match_status: string }[];
};

const palette = ["#047857", "#0e7490", "#ca8a04", "#c2410c", "#334155", "#65a30d", "#0891b2", "#be123c"];

function Metric({ label, value, note, icon: Icon, tone }: { label: string; value: string; note: string; icon: typeof CheckCircle2; tone: string }) {
  return <article className="border-l-2 border-emerald-700 bg-white px-4 py-4 shadow-sm shadow-slate-900/[0.03]">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><Icon size={17} className={tone} /></div>
    <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p>
  </article>;
}

export default function AdminInsights() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Dashboard data unavailable");
      setData(result as DashboardData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Dashboard data unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    const refreshTimer = window.setInterval(() => { void load(); }, 60_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (error) return <div className="my-6 flex items-center justify-between border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={14} />Retry</button></div>;
  if (!data) return <div className="my-6 h-48 animate-pulse border border-slate-200 bg-white" aria-label="Loading dashboard metrics" />;

  const matchHealth = data.matchHealth.filter((item) => item.value > 0);
  return <section className="space-y-6 py-6" aria-label="Analytics dashboard">
    <div className="flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">Performance snapshot</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Grading pipeline</h2></div><button type="button" onClick={() => void load()} aria-label="Refresh analytics" title="Refresh analytics" className="grid size-9 place-items-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Active quizzes" value={String(data.metrics.activeQuizzes)} note="Synced quiz sheets" icon={CheckCircle2} tone="text-emerald-700" />
      <Metric label="Submissions ingested" value={data.metrics.totalSubmissions.toLocaleString()} note="All recorded responses" icon={CheckCircle2} tone="text-teal-700" />
      <Metric label="Matched successfully" value={`${data.metrics.matchRate}%`} note={`${data.metrics.identifiableMatchRate}% of entries with a phone`} icon={CheckCircle2} tone="text-emerald-700" />
      <Metric label="Awaiting approval" value={String(data.metrics.pendingReview)} note="Identity review queue" icon={AlertTriangle} tone="text-amber-700" />
      <Metric label="International reach" value={String(data.metrics.internationalStudents)} note="Registered outside Pakistan" icon={Globe2} tone="text-teal-700" />
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
      <article className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-semibold text-slate-900">Participation &amp; average score</h3><p className="mt-1 text-xs text-slate-500">Submission volume and mean score by quiz</p></div><span className="text-xs text-slate-400">{data.quizTrend.length} quizzes</span></div>
        <div className="h-[290px] p-3"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.quizTrend} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
          <CartesianGrid stroke="#e8eeea" vertical={false} /><XAxis dataKey="quiz" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ border: "1px solid #dbe4de", borderRadius: 4, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar yAxisId="left" dataKey="participants" name="Participants" fill="#047857" radius={[2, 2, 0, 0]} maxBarSize={24} /><Line yAxisId="right" type="monotone" dataKey="averageScore" name="Average score" stroke="#c2410c" strokeWidth={2} dot={{ r: 2, fill: "#c2410c" }} connectNulls />
        </ComposedChart></ResponsiveContainer></div>
      </article>
      <article className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold text-slate-900">International students</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Globe2 size={13} />{data.metrics.internationalStudents} registrations outside Pakistan</p></div>
        <div className="h-[205px] p-2"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.demographics} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2}>{data.demographics.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={{ border: "1px solid #dbe4de", borderRadius: 4, fontSize: 12 }} /></PieChart></ResponsiveContainer></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-5 pb-5">{data.demographics.map((item, index) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs"><span className="size-2 shrink-0" style={{ backgroundColor: palette[index % palette.length] }} /><span className="truncate text-slate-600">{item.name}</span><span className="ml-auto font-semibold tabular-nums text-slate-800">{item.value}</span></div>)}</div>
      </article>
    </div>
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <article className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold text-slate-900">Identity match health</h3><p className="mt-1 text-xs text-slate-500">Current outcome across all submissions</p></div>
        <div className="space-y-4 p-5">{matchHealth.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-600">{item.name}</span><span className="font-semibold tabular-nums text-slate-800">{item.value.toLocaleString()}</span></div><div className="h-2 bg-slate-100"><div className="h-full" style={{ width: `${data.metrics.totalSubmissions ? item.value / data.metrics.totalSubmissions * 100 : 0}%`, backgroundColor: item.fill }} /></div></div>)}</div>
      </article>
      <article className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold text-slate-900">Recent ingestion</h3><p className="mt-1 text-xs text-slate-500">Latest responses across active quizzes</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-2.5 font-semibold">Student response</th><th className="px-3 py-2.5 font-semibold">Quiz</th><th className="px-3 py-2.5 font-semibold">Score</th><th className="px-5 py-2.5 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.recent.map((row) => <tr key={row.id}><td className="max-w-[200px] truncate px-5 py-3 text-xs font-medium text-slate-800">{row.typed_name || "Unnamed response"}<span className="mt-1 block font-normal text-slate-400">{new Date(row.timestamp).toLocaleString()}</span></td><td className="px-3 py-3 text-xs text-slate-600">#{row.quiz_id}</td><td className="px-3 py-3 text-xs tabular-nums text-slate-600">{row.score ?? "-"}</td><td className="px-5 py-3"><span className={`whitespace-nowrap border px-2 py-1 text-[10px] font-semibold ${row.match_status === "matched" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : row.match_status === "pending_review" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{row.match_status.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div>
      </article>
    </div>
  </section>;
}