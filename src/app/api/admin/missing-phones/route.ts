import { z } from "zod";
import { supabase } from "@/lib/supabase";

const linkSchema = z.object({ submissionId: z.number().int().positive(), studentId: z.string().trim().min(1).max(50) });

export async function GET() {
  const [submissions, registrations] = await Promise.all([
    supabase.from("submissions").select("id, quiz_id, timestamp, typed_name, phone, score").eq("match_status", "missing_phone").order("typed_name").limit(1000),
    supabase.from("registrations").select("student_id, name, phone, normalized_phone").eq("status", "active").order("name").limit(1500),
  ]);
  const error = submissions.error ?? registrations.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: submissions.data ?? [], students: registrations.data ?? [] });
}

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = linkSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "Expected a submission id and registered student id" }, { status: 400 });
  const { data: student, error: studentError } = await supabase.from("registrations").select("student_id").eq("student_id", parsed.data.studentId).maybeSingle();
  if (studentError) return Response.json({ error: studentError.message }, { status: 500 });
  if (!student) return Response.json({ error: "Student is not registered" }, { status: 404 });
  const { data, error } = await supabase.from("submissions").update({ matched_student_id: student.student_id, student_id: student.student_id, match_status: "matched" }).eq("id", parsed.data.submissionId).eq("match_status", "missing_phone").select("id").maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Submission was not found or is no longer missing a phone" }, { status: 409 });
  return Response.json({ item: data });
}