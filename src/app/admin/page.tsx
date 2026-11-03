import { Suspense } from "react";
import AdminAnalytics, { type AdminQuiz, type AnalyticsData, type AnalyticsSubmission } from "@/components/admin/AdminAnalytics";
import { supabase } from "@/lib/supabase";

async function loadSubmissions() {
  const submissions: AnalyticsSubmission[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("submissions")
      .select("quiz_id, score, match_status, phone, normalized_phone")
      .range(from, from + 999);

    if (error) throw new Error(`Unable to load submission analytics: ${error.message}`);
    submissions.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  return submissions;
}

function getInternationalPrefix(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("03")) return `+92${digits.slice(1)}`;
  if (digits.startsWith("92")) return `+${digits}`;
  return `+${digits}`;
}

async function AdminDashboardData() {
  const [quizResult, totalResult, matchedResult, pendingResult, submissions] = await Promise.all([
    supabase.from("quizzes").select("id, title, spreadsheet_id, tab_gid, status").order("id"),
    supabase.from("submissions").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("match_status", "matched"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("match_status", "pending_review"),
    loadSubmissions(),
  ]);

  const queryError = quizResult.error ?? totalResult.error ?? matchedResult.error ?? pendingResult.error;
  if (queryError) throw new Error(`Unable to load admin analytics: ${queryError.message}`);

  const quizzes: AdminQuiz[] = (quizResult.data ?? []).map((quiz) => ({
    ...quiz,
    status: quiz.status ?? "inactive",
    submissions: 0,
  }));
  const quizById = new Map(quizzes.map((quiz) => [String(quiz.id), quiz]));
  const trendByQuiz = new Map<string, { count: number; scoreTotal: number; scoreCount: number }>();
  const regions = { pakistan: 0, international: 0 };

  for (const submission of submissions) {
    const quizId = String(submission.quiz_id);
    const aggregate = trendByQuiz.get(quizId) ?? { count: 0, scoreTotal: 0, scoreCount: 0 };
    aggregate.count += 1;
    if (typeof submission.score === "number") {
      aggregate.scoreTotal += submission.score;
      aggregate.scoreCount += 1;
    }
    trendByQuiz.set(quizId, aggregate);

    const quiz = quizById.get(quizId);
    if (quiz) quiz.submissions += 1;

    const phone = submission.normalized_phone ?? submission.phone;
    if (phone) {
      const prefix = getInternationalPrefix(phone);
      if (prefix?.startsWith("+92")) regions.pakistan += 1;
      else if (prefix) regions.international += 1;
    }
  }

  const analytics: AnalyticsData = {
    totalSubmissions: totalResult.count ?? submissions.length,
    matchedSubmissions: matchedResult.count ?? 0,
    pendingReview: pendingResult.count ?? 0,
    activeQuizzes: quizzes.filter((quiz) => quiz.status === "active").length,
    quizzes,
    trend: quizzes
      .slice()
      .sort((left, right) => Number(left.id) - Number(right.id))
      .map((quiz) => {
        const aggregate = trendByQuiz.get(String(quiz.id));
        return {
          quiz: `Quiz ${quiz.id}`,
          participants: aggregate?.count ?? 0,
          averageScore: aggregate && aggregate.scoreCount
            ? Math.round((aggregate.scoreTotal / aggregate.scoreCount) * 100) / 100
            : null,
        };
      }),
    regions,
  };

  const dashboardKey = analytics.quizzes.map((quiz) => `${quiz.id}:${quiz.status}`).join(",");
  return <AdminAnalytics key={dashboardKey} initialData={analytics} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">
        <div className="mb-7 space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
          <div className="h-[370px] animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-[370px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="mt-7 h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </main>
    }>
      <AdminDashboardData />
    </Suspense>
  );
}
