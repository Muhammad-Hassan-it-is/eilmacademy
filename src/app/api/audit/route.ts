import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("update_audit")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}