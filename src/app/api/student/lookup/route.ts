import { normalizeName, normalizePhone } from "@/lib/normalizers";
import { supabase } from "@/lib/supabase";

type Registration = {
  student_id: string;
  name: string;
  phone: string | null;
  normalized_phone: string | null;
  city: string | null;
};

type Submission = {
  quiz_id: string;
  timestamp: string;
  score: number | null;
  quizzes: { title: string } | { title: string }[] | null;
};

function relationValue<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export async function POST(request: Request) {
  let body: { query?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return Response.json({ error: "Enter a phone number or name" }, { status: 400 });
  }

  const normalized = normalizePhone(query) ?? (/^\+[1-9]\d{7,14}$/.test(query) ? query : null);
  let student: Registration | null = null;

  if (normalized) {
    const [normalizedPhoneResult, oldPhoneResult] = await Promise.all([
      supabase
        .from("registrations")
        .select("student_id, name, phone, normalized_phone, city")
        .eq("normalized_phone", normalized)
        .limit(1),
      supabase
        .from("registrations")
        .select("student_id, name, phone, normalized_phone, city")
        .eq("old_phone", query)
        .limit(1),
    ]);

    const error = normalizedPhoneResult.error ?? oldPhoneResult.error;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    student = normalizedPhoneResult.data?.[0] ?? oldPhoneResult.data?.[0] ?? null;
  } else {
    const normalizedName = normalizeName(query);
    const [nameResult, normalizedNameResult] = await Promise.all([
      supabase
        .from("registrations")
        .select("student_id, name, phone, normalized_phone, city")
        .ilike("name", `%${query}%`)
        .limit(1),
      supabase
        .from("registrations")
        .select("student_id, name, phone, normalized_phone, city")
        .ilike("normalized_name", `%${normalizedName}%`)
        .limit(1),
    ]);

    const error = nameResult.error ?? normalizedNameResult.error;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    student = nameResult.data?.[0] ?? normalizedNameResult.data?.[0] ?? null;
  }

  let submissions: Submission[] = [];
  let studentDetails = student;

  if (student) {
    const [matchedStudentSubmissions, phoneSubmissions] = await Promise.all([
      supabase
        .from("submissions")
        .select("quiz_id, timestamp, score, quizzes(title)")
        .eq("matched_student_id", student.student_id),
      student.normalized_phone
        ? supabase
            .from("submissions")
            .select("quiz_id, timestamp, score, quizzes(title)")
            .eq("normalized_phone", student.normalized_phone)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const error = matchedStudentSubmissions.error ?? phoneSubmissions.error;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const uniqueSubmissions = new Map(
      [...(matchedStudentSubmissions.data ?? []), ...(phoneSubmissions.data ?? [])].map((item) => [
        `${item.quiz_id}-${item.timestamp}`,
        item,
      ]),
    );
    submissions = [...uniqueSubmissions.values()] as Submission[];
  } else {
    const normalizedQuery = normalizePhone(query);
    const [phoneSubmissions, nameSubmissions] = await Promise.all([
      normalizedQuery
        ? supabase
            .from("submissions")
            .select("quiz_id, timestamp, score, typed_name, phone, normalized_phone, quizzes(title)")
            .eq("normalized_phone", normalizedQuery)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("submissions")
        .select("quiz_id, timestamp, score, typed_name, phone, normalized_phone, quizzes(title)")
        .ilike("typed_name", `%${query}%`),
    ]);

    const error = phoneSubmissions.error ?? nameSubmissions.error;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const uniqueSubmissions = new Map(
      [...(phoneSubmissions.data ?? []), ...(nameSubmissions.data ?? [])].map((item) => [
        `${item.quiz_id}-${item.timestamp}`,
        item,
      ]),
    );
    submissions = [...uniqueSubmissions.values()].map((item) => item as Submission);

    if (submissions.length) {
      const firstSubmission = submissions[0] as Submission & {
        typed_name?: string;
        phone?: string | null;
        normalized_phone?: string | null;
      };
      studentDetails = {
        student_id: "unregistered",
        name: firstSubmission.typed_name ?? query,
        phone: firstSubmission.phone ?? null,
        normalized_phone: firstSubmission.normalized_phone ?? normalizedQuery,
        city: null,
      };
    }
  }

  if (!studentDetails) {
    return Response.json({ error: "No student or quiz results found" }, { status: 404 });
  }

  const scores = submissions.map((submission) => submission.score).filter((score): score is number => score !== null);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  return Response.json({
    student: {
      student_id: studentDetails.student_id,
      name: studentDetails.name,
      phone: studentDetails.phone,
      city: studentDetails.city,
    },
    total_quizzes: submissions.length,
    total_score: totalScore,
    average_score: scores.length ? Math.round((totalScore / scores.length) * 100) / 100 : 0,
    quizzes: submissions
      .sort((left, right) => String(left.quiz_id).localeCompare(String(right.quiz_id), undefined, { numeric: true }))
      .map((submission) => ({
        quiz_id: submission.quiz_id,
        quiz_title: relationValue(submission.quizzes)?.title ?? `Quiz ${submission.quiz_id}`,
        score: submission.score,
        timestamp: submission.timestamp,
      })),
  });
}