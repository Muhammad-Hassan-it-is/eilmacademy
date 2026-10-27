export type MatchStatus =
  | "matched"
  | "missing_phone"
  | "invalid_phone"
  | "not_registered"
  | "duplicate_registration"
  | "review_required"
  | "ignored_test";

export type QueueStatus =
  | "pending"
  | "approved"
  | "applied"
  | "rejected"
  | "review_required";

export interface Registration {
  student_id: string;
  name: string;
  normalized_name: string;
  phone: string | null;
  normalized_phone: string | null;
  old_phone: string | null;
  status: string;
  source_row: number;
}

export interface Quiz {
  id: string;
  title: string;
  spreadsheet_id: string;
  tab_gid: number;
  enabled: boolean;
  last_synced_row: number;
  last_synced_at: string | null;
}

export interface Submission {
  id: string;
  quiz_id: string;
  source_row: number;
  timestamp: string;
  typed_name: string;
  phone: string | null;
  normalized_phone: string | null;
  score: number | null;
  match_status: MatchStatus;
  matched_student_id: string | null;
}

export interface PhoneUpdateQueue {
  id: string;
  quiz_id: string;
  submission_id: string;
  cell: string;
  old_phone: string | null;
  new_phone: string;
  student_id: string;
  status: QueueStatus;
  reason: string | null;
  approved_at: string | null;
  applied_at: string | null;
}

export interface UpdateAudit {
  id: string;
  queue_id: string;
  timestamp: string;
  quiz_title: string;
  cell: string;
  old_value: string | null;
  new_value: string;
  result: string;
  error: string | null;
}