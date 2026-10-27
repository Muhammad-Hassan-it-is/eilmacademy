import { supabase } from "@/lib/supabase";

const pendingReviewStatuses = [
  "review_required",
  "missing_phone",
  "duplicate_registration",
] as const;

export async function GET() {
  const [registrations, submissions, matched, pendingReview, pendingQueue] =
    await Promise.all([
      supabase.from("registrations").select("student_id", { count: "exact", head: true }),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("match_status", "matched"),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("match_status", pendingReviewStatuses),
      supabase
        .from("phone_update_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const error = [
    registrations,
    submissions,
    matched,
    pendingReview,
    pendingQueue,
  ].find((result) => result.error)?.error;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    total_registered: registrations.count ?? 0,
    total_submissions: submissions.count ?? 0,
    matched_submissions: matched.count ?? 0,
    pending_review: pendingReview.count ?? 0,
    pending_queue_updates: pendingQueue.count ?? 0,
  });
}