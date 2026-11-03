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
};

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
        .select("quiz_id, timestamp, score")
        .eq("matched_student_id", student.student_id),
      student.normalized_phone
        ? supabase
            .from("submissions")
            .select("quiz_id, timestamp, score")
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
            .select("quiz_id, timestamp, score, typed_name, phone, normalized_phone")
            .eq("normalized_phone", normalizedQuery)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("submissions")
        .select("quiz_id, timestamp, score, typed_name, phone, normalized_phone")
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

  const { data: activeQuizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, title, quiz_url, max_marks")
    .eq("status", "active");

  if (quizzesError) {
    return Response.json({ error: quizzesError.message }, { status: 500 });
  }

  const quizById = new Map((activeQuizzes ?? []).map((quiz) => [String(quiz.id), quiz]));
  const submissionByQuiz = new Map<string, Submission>();
  for (const submission of submissions) {
    const quizId = String(submission.quiz_id);
    if (!quizById.has(quizId)) continue;
    const existing = submissionByQuiz.get(quizId);
    if (!existing || new Date(submission.timestamp) > new Date(existing.timestamp)) {
      submissionByQuiz.set(quizId, submission);
    }
  }

  const quizResults = [...(activeQuizzes ?? [])]
    .map((quiz) => {
      const matchedSubmission = submissionByQuiz.get(String(quiz.id));
      return {
        quiz_id: String(quiz.id),
        quiz_title: quiz.title,
        quiz_url: quiz.quiz_url,
        max_marks: quiz.max_marks === null ? null : Number(quiz.max_marks),
        score: matchedSubmission?.score ?? null,
        timestamp: matchedSubmission?.timestamp ?? null,
      };
    })
    .sort((left, right) => right.quiz_id.localeCompare(left.quiz_id, undefined, { numeric: true }));
  const completedResults = quizResults.filter((quiz) => quiz.timestamp !== null);
  const percentageScores = completedResults.flatMap((quiz) =>
    quiz.score !== null && quiz.max_marks && quiz.max_marks > 0
      ? [(quiz.score / quiz.max_marks) * 100]
      : [],
  );
  const averagePercentage = percentageScores.length
    ? Math.round((percentageScores.reduce((sum, score) => sum + score, 0) / percentageScores.length) * 10) / 10
    : 0;

  return Response.json({
    student: {
      student_id: studentDetails.student_id,
      name: studentDetails.name,
      phone: studentDetails.phone,
      city: studentDetails.city,
    },
    total_quizzes: completedResults.length,
    average_score: averagePercentage,
    quizzes: quizResults,
  });
}