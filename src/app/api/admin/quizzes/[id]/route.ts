import { z } from "zod";
import { supabase } from "@/lib/supabase";

const updateSchema = z.object({ status: z.enum(["active", "inactive"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Expected active or inactive quiz status" }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("quizzes")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Quiz not found" }, { status: 404 });
  return Response.json({ item: data });
}
