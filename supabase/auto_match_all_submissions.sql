create or replace function public.auto_match_all_submissions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions as submission
  set matched_student_id = registration.student_id,
      match_status = 'matched'
  from public.registrations as registration
  where submission.matched_student_id is null
    and submission.normalized_phone is not null
    and submission.normalized_phone = registration.normalized_phone;
end;
$$;