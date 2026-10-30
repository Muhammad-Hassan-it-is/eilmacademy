CREATE OR REPLACE FUNCTION public.resolve_submission_identity(
  p_submission_id BIGINT,
  p_decision TEXT,
  p_student_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  submission_row public.submissions%ROWTYPE;
  resolved_student_id TEXT;
BEGIN
  IF p_decision NOT IN ('approve', 'external') THEN
    RAISE EXCEPTION 'Unsupported identity decision' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO submission_row
  FROM public.submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found' USING ERRCODE = 'P0002';
  END IF;
  IF submission_row.match_status <> 'pending_review' THEN
    RAISE EXCEPTION 'Submission is no longer pending review' USING ERRCODE = 'P0001';
  END IF;

  IF p_decision = 'external' THEN
    UPDATE public.submissions
    SET match_status = 'missing_phone', matched_student_id = NULL, student_id = NULL
    WHERE id = p_submission_id;
    RETURN jsonb_build_object('id', p_submission_id, 'decision', 'external');
  END IF;

  IF p_student_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.registrations WHERE student_id = p_student_id
  ) THEN
    RAISE EXCEPTION 'Registered student not found' USING ERRCODE = 'P0002';
  END IF;

  resolved_student_id := p_student_id;
  UPDATE public.submissions
  SET matched_student_id = resolved_student_id,
      student_id = resolved_student_id,
      match_status = 'matched'
  WHERE id = p_submission_id;

  INSERT INTO public.student_aliases (typed_name, phone_variant, target_student_id, approved_by)
  SELECT NULLIF(BTRIM(submission_row.typed_name), ''),
         COALESCE(NULLIF(BTRIM(submission_row.normalized_phone), ''), NULLIF(BTRIM(submission_row.phone), '')),
         resolved_student_id,
         'admin'
  WHERE NULLIF(BTRIM(submission_row.typed_name), '') IS NOT NULL
     OR COALESCE(NULLIF(BTRIM(submission_row.normalized_phone), ''), NULLIF(BTRIM(submission_row.phone), '')) IS NOT NULL
  ON CONFLICT (typed_name, phone_variant)
  DO UPDATE SET target_student_id = EXCLUDED.target_student_id, approved_by = EXCLUDED.approved_by;

  RETURN jsonb_build_object('id', p_submission_id, 'decision', 'approve', 'student_id', resolved_student_id);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_submission_identity(BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_submission_identity(BIGINT, TEXT, TEXT) TO service_role;