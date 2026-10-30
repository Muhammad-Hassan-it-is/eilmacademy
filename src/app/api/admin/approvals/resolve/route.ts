import { z } from "zod";
import { supabase } from "@/lib/supabase";

const resolveSchema = z.object({
  submissionId: z.number().int().positive(),
  decision: z.enum(["approve", "external"]),
  studentId: z.string().trim().min(1).max(50).optional(),
}).superRefine((body, context) => {
  if (body.decision === "approve" && !body.studentId) {
    context.addIssue({ code: "custom", path: ["studentId"], message: "Choose a registered student" });
  }
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = resolveSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { submissionId, decision, studentId } = parsed.data;
  if (decision === "approve") {
    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("student_id")
      .eq("student_id", studentId!)
      .maybeSingle();
    if (registrationError) return Response.json({ error: registrationError.message }, { status: 500 });
    if (!registration) return Response.json({ error: "Selected student is not registered" }, { status: 404 });
  }

  const { data, error } = await supabase.rpc("resolve_submission_identity", {
    p_submission_id: submissionId,
    p_decision: decision,
    p_student_id: decision === "approve" ? studentId! : null,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "P0001" ? 409 : error.code === "42883" ? 503 : 500;
    return Response.json({ error: error.code === "42883" ? "Identity resolution function is not installed. Apply the provided Supabase SQL migration." : error.message }, { status });
  }
  return Response.json({ item: data });
}