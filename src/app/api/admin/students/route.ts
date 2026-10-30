import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  let query = supabase.from("registrations").select("student_id, name, phone, normalized_phone, status, city").order("name").limit(1500);
  if (search) query = query.or(`student_id.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%,normalized_phone.ilike.%${search}%`);
  const { data: registrations, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const ids = (registrations ?? []).map((student) => student.student_id);
  const { data: submissions, error: submissionError } = ids.length
    ? await supabase.from("submissions").select("matched_student_id, score").in("matched_student_id", ids)
    : { data: [], error: null };
  if (submissionError) return Response.json({ error: submissionError.message }, { status: 500 });
  const totals = new Map<string, { count: number; score: number; scored: number }>();
  for (const submission of submissions ?? []) {
    const id = submission.matched_student_id;
    if (!id) continue;
    const total = totals.get(id) ?? { count: 0, score: 0, scored: 0 };
    total.count += 1;
    if (typeof submission.score === "number") { total.score += submission.score; total.scored += 1; }
    totals.set(id, total);
  }
  return Response.json({ items: (registrations ?? []).map((student) => {
    const total = totals.get(student.student_id) ?? { count: 0, score: 0, scored: 0 };
    return { ...student, quizzesTaken: total.count, averageScore: total.scored ? Math.round(total.score / total.scored * 100) / 100 : null };
  }) });
}