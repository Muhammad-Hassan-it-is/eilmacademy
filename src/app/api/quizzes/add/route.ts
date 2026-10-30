import { supabase } from "@/lib/supabase";

const spreadsheetIdPattern = /\/d\/([a-zA-Z0-9-_]+)/;
const tabGidPattern = /[#&]gid=([0-9]+)/;

export async function POST(request: Request) {
  let body: { id?: unknown; title?: unknown; sheetUrl?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" || typeof body.id === "number" ? String(body.id).trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const sheetUrl = typeof body.sheetUrl === "string" ? body.sheetUrl.trim() : "";
  const spreadsheetMatch = sheetUrl.match(spreadsheetIdPattern);

  if (!id || !title || !spreadsheetMatch?.[1]) {
    return Response.json(
      { success: false, error: "Quiz ID, title, and a valid Google Sheet URL are required" },
      { status: 400 },
    );
  }

  const spreadsheetId = spreadsheetMatch[1];
  const tabGid = sheetUrl.match(tabGidPattern)?.[1] ?? "0";

  const { data: quiz, error: upsertError } = await supabase
    .from("quizzes")
    .upsert(
      {
        id,
        title,
        spreadsheet_id: spreadsheetId,
        tab_gid: tabGid,
        status: "active",
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (upsertError) {
    return Response.json(
      { success: false, error: `Quiz could not be saved: ${upsertError.message}` },
      { status: 500 },
    );
  }

  const { error: matchError } = await supabase.rpc("auto_match_all_submissions");

  if (matchError) {
    return Response.json(
      { success: false, error: `Quiz was saved, but matching failed: ${matchError.message}` },
      { status: 500 },
    );
  }

  return Response.json({ success: true, message: "Quiz added and submissions matched", quiz });
}