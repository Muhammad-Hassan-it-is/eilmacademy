import { supabase } from "@/lib/supabase";
import type { QueueStatus } from "@/types/database";

const allowedStatuses = ["approved", "rejected"] as const;
type QueueDecision = (typeof allowedStatuses)[number];

export async function GET() {
  const { data, error } = await supabase
    .from("phone_update_queue")
    .select("*, quizzes(title), registrations(name)")
    .order("id", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  let body: { id?: number; status?: QueueDecision };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.id !== "number" ||
    !Number.isInteger(body.id) ||
    !body.status ||
    !allowedStatuses.includes(body.status)
  ) {
    return Response.json(
      { error: "Expected an integer id and status of approved or rejected" },
      { status: 400 },
    );
  }

  const update: { status: QueueStatus; approved_at?: string | null } = {
    status: body.status,
  };

  if (body.status === "approved") {
    update.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("phone_update_queue")
    .update(update)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return Response.json({ error: error.message }, { status });
  }

  return Response.json({ item: data });
}