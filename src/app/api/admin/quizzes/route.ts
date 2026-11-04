import { after } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

const createSchema = z.object({
  id: z.union([z.string().trim().regex(/^[1-9]\d*$/), z.number().int().positive()]),
  title: z.string().trim().min(1).max(200),
  maxMarks: z.number().finite().positive(),
  quizUrl: z.string().url(),
  sheetUrl: z.string().url(),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ success: false, error: "Admin authentication required" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ success: false, error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ success: false, error: "Quiz ID, title, total marks, quiz link, and a valid Google Sheet URL are required" }, { status: 400 });
  }

  const sheetUrl = new URL(parsed.data.sheetUrl);
  const spreadsheetMatch = sheetUrl.hostname === "docs.google.com"
    ? sheetUrl.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    : null;
  const gid = sheetUrl.searchParams.get("gid")
    ?? new URLSearchParams(sheetUrl.hash.replace(/^#/, "")).get("gid")
    ?? "0";
  const tabGid = Number(gid);

  if (!spreadsheetMatch?.[1] || !/^\d+$/.test(gid) || !Number.isSafeInteger(tabGid) || tabGid < 0) {
    return Response.json({ success: false, error: "Enter a valid Google Sheets URL with a valid tab ID" }, { status: 400 });
  }

  const id = String(parsed.data.id);
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({
      id,
      title: parsed.data.title,
      spreadsheet_id: spreadsheetMatch[1],
      tab_gid: tabGid,
      max_marks: parsed.data.maxMarks,
      quiz_url: parsed.data.quizUrl,
      status: "active",
    })
    .select("id, title, spreadsheet_id, tab_gid, quiz_url, max_marks, status")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return Response.json({ success: false, error: `Quiz could not be saved: ${error.message}` }, { status });
  }

  after(async () => {
    try {
      const { error: matchError } = await supabase.rpc("auto_match_all_submissions");
      if (matchError) console.error("Background submission matching failed:", matchError);
    } catch (matchError) {
      console.error("Background submission matching failed:", matchError);
    }
  });

  return Response.json({ success: true, message: "Quiz added successfully", quiz }, { status: 201 });
}