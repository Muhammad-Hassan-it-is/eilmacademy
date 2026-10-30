import { z } from "zod";
import { supabase } from "@/lib/supabase";

const updateSchema = z.object({ id: z.union([z.string(), z.number()]), status: z.enum(["active", "inactive"]) });

export async function GET() {
  const [quizzes, submissions] = await Promise.all([
    supabase.from("quizzes").select("id, title, status, last_synced_at").order("id"),
    supabase.from("submissions").select("quiz_id"),
  ]);
  const error = quizzes.error ?? submissions.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const counts = new Map<string, number>();
  for (const submission of submissions.data ?? []) {
    const key = String(submission.quiz_id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Response.json({ items: (quizzes.data ?? []).map((quiz) => ({ ...quiz, submissions: counts.get(String(quiz.id)) ?? 0 })) });
}

export async function PATCH(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Expected quiz id and active/inactive status" }, { status: 400 });
  const { data, error } = await supabase.from("quizzes").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("id, status").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Quiz not found" }, { status: 404 });
  return Response.json({ item: data });
}