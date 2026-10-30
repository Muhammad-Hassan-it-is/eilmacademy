import { supabase } from "@/lib/supabase";

type SubmissionRow = {
  id: number;
  quiz_id: string | number;
  timestamp: string;
  typed_name: string | null;
  phone: string | null;
  normalized_phone: string | null;
  score: number | null;
  match_status: string;
};

const countries = [
  ["+92", "Pakistan"], ["+966", "Saudi Arabia"], ["+1", "USA / Canada"],
  ["+968", "Oman"], ["+44", "United Kingdom"], ["+31", "Netherlands"],
  ["+60", "Malaysia"], ["+34", "Spain"],
] as const;

export async function GET() {
  const [quizResult, registrationResult, recentResult] = await Promise.all([
    supabase.from("quizzes").select("id, title, status").eq("status", "active").order("id"),
    supabase.from("registrations").select("normalized_phone"),
    supabase.from("submissions").select("id, quiz_id, timestamp, typed_name, phone, normalized_phone, score, match_status").order("timestamp", { ascending: false }).limit(10),
  ]);
  const initialError = quizResult.error ?? registrationResult.error ?? recentResult.error;
  if (initialError) return Response.json({ error: initialError.message }, { status: 500 });

  const rows: SubmissionRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("submissions")
      .select("id, quiz_id, timestamp, typed_name, phone, normalized_phone, score, match_status")
      .range(from, from + 999);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    rows.push(...((data ?? []) as SubmissionRow[]));
    if (!data || data.length < 1000) break;
  }

  const statusCounts = { matched: 0, missing_phone: 0, pending_review: 0, other: 0 };
  const byQuiz = new Map<string, { participants: number; scoreTotal: number; scoreCount: number }>();
  for (const row of rows) {
    if (row.match_status === "matched") statusCounts.matched += 1;
    else if (row.match_status === "missing_phone") statusCounts.missing_phone += 1;
    else if (row.match_status === "pending_review") statusCounts.pending_review += 1;
    else statusCounts.other += 1;

    const key = String(row.quiz_id);
    const aggregate = byQuiz.get(key) ?? { participants: 0, scoreTotal: 0, scoreCount: 0 };
    aggregate.participants += 1;
    if (typeof row.score === "number") {
      aggregate.scoreTotal += row.score;
      aggregate.scoreCount += 1;
    }
    byQuiz.set(key, aggregate);
  }

  const quizIds = new Set((quizResult.data ?? []).map((quiz) => String(quiz.id)));
  const quizTrend = [...byQuiz.entries()]
    .filter(([quizId]) => quizIds.has(quizId))
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([quizId, aggregate]) => ({
      quiz: `Quiz ${quizId}`,
      participants: aggregate.participants,
      averageScore: aggregate.scoreCount ? Math.round((aggregate.scoreTotal / aggregate.scoreCount) * 100) / 100 : null,
    }));

  const international = new Map<string, number>();
  for (const registration of registrationResult.data ?? []) {
    const phone = registration.normalized_phone ?? "";
    const country = countries.find(([prefix]) => phone.startsWith(prefix));
    if (country && country[1] !== "Pakistan") international.set(country[1], (international.get(country[1]) ?? 0) + 1);
  }

  const total = rows.length;
  const identifiable = total - statusCounts.missing_phone;
  return Response.json({
    metrics: {
      activeQuizzes: (quizResult.data ?? []).length,
      totalSubmissions: total,
      matched: statusCounts.matched,
      pendingReview: statusCounts.pending_review,
      matchRate: total ? Math.round((statusCounts.matched / total) * 1000) / 10 : 0,
      identifiableMatchRate: identifiable ? Math.round((statusCounts.matched / identifiable) * 1000) / 10 : 0,
      internationalStudents: [...international.values()].reduce((sum, count) => sum + count, 0),
    },
    quizTrend,
    demographics: [...international.entries()].map(([name, value]) => ({ name, value })),
    matchHealth: [
      { name: "Matched", value: statusCounts.matched, fill: "#047857" },
      { name: "Missing phone", value: statusCounts.missing_phone, fill: "#d97706" },
      { name: "Pending review", value: statusCounts.pending_review, fill: "#dc2626" },
      { name: "Other", value: statusCounts.other, fill: "#94a3b8" },
    ],
    recent: recentResult.data ?? [],
    updatedAt: new Date().toISOString(),
  });
}