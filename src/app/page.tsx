"use client";

import {
  Activity,
  ArrowUpRight,
  Check,
  ClipboardList,
  Clock3,
  Database,
  FileCheck2,
  LayoutDashboard,
  ListChecks,
  Percent,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type Tab = "overview" | "queue" | "submissions" | "audit";
type MatchStatus =
  | "matched"
  | "missing_phone"
  | "invalid_phone"
  | "not_registered"
  | "duplicate_registration"
  | "review_required"
  | "ignored_test";

interface Stats {
  total_registered: number;
  total_submissions: number;
  matched_submissions: number;
  pending_review: number;
  pending_queue_updates: number;
}

interface QueueItem {
  id: number;
  quiz_id: string;
  cell: string;
  new_phone: string;
  student_id: string;
  reason: string | null;
  quizzes?: { title: string } | { title: string }[] | null;
  registrations?: { name: string } | { name: string }[] | null;
}

interface SubmissionItem {
  id: string;
  timestamp: string;
  typed_name: string;
  score: number | null;
  match_status: MatchStatus;
  matched_student_id: string | null;
}

interface AuditItem {
  id: string;
  timestamp: string;
  quiz_title: string;
  cell: string;
  old_value: string | null;
  new_value: string;
  result: string;
}

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "queue", label: "Phone Update Queue", icon: ListChecks },
  { id: "submissions", label: "Submissions", icon: ClipboardList },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

const statusLabels: Record<string, string> = {
  matched: "Matched",
  missing_phone: "Missing phone",
  invalid_phone: "Invalid phone",
  not_registered: "Not registered",
  duplicate_registration: "Duplicate",
  review_required: "Review required",
  ignored_test: "Ignored test",
};

function relationValue<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "matched") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "missing_phone") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "review_required") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-400"><Database size={19} /></div>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-xs text-slate-400">New records will appear here automatically.</p>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/queue"),
        fetch("/api/submissions?page=1&limit=8"),
        fetch("/api/audit"),
      ]);
      if (!responses.every((response) => response.ok)) throw new Error("Dashboard data could not be loaded");
      const [statsData, queueData, submissionsData, auditData] = await Promise.all(responses.map((response) => response.json()));
      setStats(statsData);
      setQueue(queueData.items ?? []);
      setSubmissions(submissionsData.items ?? []);
      setAudit(auditData.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  async function decideQueueItem(id: number, status: "approved" | "rejected") {
    setActionId(id);
    setError(null);
    try {
      const response = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Queue update failed");
      setQueue((items) => items.filter((item) => item.id !== id));
      setStats((current) => current ? { ...current, pending_queue_updates: Math.max(0, current.pending_queue_updates - 1) } : current);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Queue update failed");
    } finally {
      setActionId(null);
    }
  }

  const matchRate = stats && stats.total_submissions > 0 ? Math.round((stats.matched_submissions / stats.total_submissions) * 100) : 0;
  const normalizedSearch = submissionSearch.trim().toLowerCase();
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesStatus = !submissionFilter || submission.match_status === submissionFilter;
    const matchesSearch = !normalizedSearch || submission.typed_name.toLowerCase().includes(normalizedSearch) || submission.matched_student_id?.toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-10 lg:py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700"><span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" />Operations console</div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Student &amp; Quiz Admin Hub</h1>
            <p className="mt-2 text-sm text-slate-500">A clear view of registration, matching, and phone update work.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto"><a href="/student" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700">Open Student Portal →</a><div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>System operational<button type="button" onClick={() => void loadDashboard()} className="ml-1 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Refresh dashboard"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button></div></div>
        </header>

        {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button></div>}

        <nav className="mb-7 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Dashboard sections">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}><Icon size={16} />{label}{id === "queue" && Boolean(stats?.pending_queue_updates) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">{stats?.pending_queue_updates}</span>}</button>)}
        </nav>

        {activeTab === "overview" && <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total registered students" value={stats?.total_registered} icon={UserRound} accent="teal" detail="Across all active registrations" />
            <MetricCard label="Quiz submissions" value={stats?.total_submissions} icon={FileCheck2} accent="blue" detail="Responses received to date" />
            <MetricCard label="Match rate" value={`${matchRate}%`} icon={Percent} accent="violet" detail={`${stats?.matched_submissions ?? 0} submissions matched`} />
            <MetricCard label="Pending phone writes" value={stats?.pending_queue_updates} icon={Smartphone} accent="amber" detail="Waiting for an admin decision" />
          </section>
          <section className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <Panel title="Recent activity" icon={Activity} action={<button type="button" onClick={() => setActiveTab("submissions")} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900">View submissions <ArrowUpRight size={14} /></button>}>
              {submissions.length ? <div className="divide-y divide-slate-100">{submissions.slice(0, 5).map((submission) => <div key={submission.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-slate-100 p-2 text-slate-500"><ClipboardList size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{submission.typed_name || "Unnamed response"}</p><p className="mt-0.5 text-xs text-slate-400">{formatDate(submission.timestamp)}</p></div></div><StatusBadge status={submission.match_status} /></div>)}</div> : <EmptyState label="No recent submissions" />}
            </Panel>
            <Panel title="System health" icon={ShieldCheck}>
              <div className="space-y-4 p-5"><HealthRow label="Supabase connection" status="Operational" /><HealthRow label="Registration matching" status="Ready" /><HealthRow label="Phone write queue" status={`${stats?.pending_queue_updates ?? 0} pending`} warning={Boolean(stats?.pending_queue_updates)} /><div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">Last checked just now <span className="float-right inline-flex items-center gap-1"><Clock3 size={12} /> Live</span></div></div>
            </Panel>
          </section>
        </>}

        {activeTab === "queue" && <Panel title="Phone update queue" icon={Smartphone} subtitle="Review proposed registration changes before they are written.">
          {queue.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Row / cell</th><th className="px-5 py-3">Proposed phone</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3 text-right">Decision</th></tr></thead><tbody className="divide-y divide-slate-100">{queue.map((item) => { const quiz = relationValue(item.quizzes); const registration = relationValue(item.registrations); return <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{quiz?.title ?? "Unknown quiz"}</p><p className="mt-1 text-xs text-slate-400">#{item.quiz_id}</p></td><td className="px-5 py-4"><span className="font-mono text-sm font-semibold text-slate-700">{item.cell}</span></td><td className="px-5 py-4 font-mono text-sm text-teal-700">{item.new_phone}</td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{registration?.name ?? "Unknown student"}</p><p className="mt-1 text-xs text-slate-400">{item.student_id}</p></td><td className="max-w-[220px] px-5 py-4 text-sm text-slate-500">{item.reason ?? "No reason provided"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={actionId === item.id} onClick={() => void decideQueueItem(item.id, "approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"><Check size={14} />Approve</button><button type="button" disabled={actionId === item.id} onClick={() => void decideQueueItem(item.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><X size={14} />Reject</button></div></td></tr>; })}</tbody></table></div> : <EmptyState label="The phone update queue is clear" />}
        </Panel>}

        {activeTab === "submissions" && <Panel title="Quiz submissions" icon={ClipboardList} subtitle="Review response matching outcomes."><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-xs flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input aria-label="Search submissions" value={submissionSearch} onChange={(event) => setSubmissionSearch(event.target.value)} placeholder="Search responses" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div><select value={submissionFilter} onChange={(event) => setSubmissionFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-500"><option value="">All statuses</option><option value="matched">Matched</option><option value="missing_phone">Missing phone</option><option value="review_required">Review required</option><option value="not_registered">Not registered</option></select></div>{filteredSubmissions.length ? <div className="divide-y divide-slate-100">{filteredSubmissions.map((submission) => <div key={submission.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-lg bg-slate-100 p-2 text-slate-500"><UserRound size={16} /></div><div><p className="text-sm font-semibold text-slate-800">{submission.typed_name || "Unnamed response"}</p><p className="mt-1 text-xs text-slate-400">{formatDate(submission.timestamp)} · Score {submission.score ?? "-"}</p></div></div><div className="flex items-center gap-3"><span className="text-xs text-slate-400">{submission.matched_student_id ?? "No student match"}</span><StatusBadge status={submission.match_status} /></div></div>)}</div> : <EmptyState label="No submissions match this filter" />}</Panel>}

        {activeTab === "audit" && <Panel title="Audit log" icon={ScrollText} subtitle="A read-only record of phone update decisions and results.">{audit.length ? <div className="divide-y divide-slate-100">{audit.map((entry) => <div key={entry.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${entry.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{entry.result}</span><span className="font-mono text-xs text-slate-400">{entry.cell}</span></div><p className="mt-2 text-sm font-semibold text-slate-800">{entry.quiz_title}</p><p className="mt-1 text-xs text-slate-500">{entry.old_value ?? "Empty"} <ArrowUpRight className="mx-1 inline" size={12} /> {entry.new_value}</p></div><time className="text-xs text-slate-400">{formatDate(entry.timestamp)}</time></div>)}</div> : <EmptyState label="No audit events yet" />}</Panel>}
      </div>
    </main>
  );
}

function MetricCard({ label, value, icon: Icon, accent, detail }: { label: string; value: number | string | undefined; icon: typeof UserRound; accent: string; detail: string }) {
  const colors: Record<string, string> = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.03)]"><div className="flex items-start justify-between"><span className={`rounded-xl p-2.5 ${colors[accent]}`}><Icon size={19} /></span><ArrowUpRight size={16} className="text-slate-300" /></div><p className="mt-6 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value ?? "-"}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>;
}

function Panel({ title, icon: Icon, subtitle, action, children }: { title: string; icon: typeof Activity; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]"><div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600"><Icon size={17} /></div><div><h2 className="text-sm font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}</div></div>{action}</div>{children}</section>;
}

function HealthRow({ label, status, warning = false }: { label: string; status: string; warning?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-slate-600"><span className={`h-2 w-2 rounded-full ${warning ? "bg-amber-400" : "bg-emerald-400"}`} />{label}</span><span className={`text-xs font-semibold ${warning ? "text-amber-700" : "text-emerald-700"}`}>{status}</span></div>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(status)}`}>{statusLabels[status] ?? status}</span>;
}
