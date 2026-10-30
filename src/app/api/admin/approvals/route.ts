import { supabase } from "@/lib/supabase";

export async function GET() {
  const [submissions, registrations] = await Promise.all([
    supabase.from("submissions").select("id, quiz_id, timestamp, typed_name, phone, normalized_phone, score, match_status, quizzes(title)").eq("match_status", "pending_review").order("timestamp", { ascending: true }).limit(200),
    supabase.from("registrations").select("student_id, name, phone, normalized_phone").eq("status", "active").order("name").limit(1500),
  ]);
  const error = submissions.error ?? registrations.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: submissions.data ?? [], students: registrations.data ?? [] });
}