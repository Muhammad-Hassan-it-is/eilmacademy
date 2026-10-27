import { supabase } from "@/lib/supabase";
import type { MatchStatus } from "@/types/database";

const matchStatuses: MatchStatus[] = [
  "matched",
  "missing_phone",
  "invalid_phone",
  "not_registered",
  "duplicate_registration",
  "review_required",
  "ignored_test",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20),
  );
  const matchStatus = searchParams.get("match_status");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (matchStatus && !matchStatuses.includes(matchStatus as MatchStatus)) {
    return Response.json({ error: "Invalid match_status" }, { status: 400 });
  }

  let query = supabase
    .from("submissions")
    .select("*", { count: "exact" })
    .order("timestamp", { ascending: false })
    .range(from, to);

  if (matchStatus) {
    query = query.eq("match_status", matchStatus);
  }

  const { data, count, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    items: data ?? [],
    page,
    limit,
    total: count ?? 0,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}