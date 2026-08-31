// lib/supabase/types.ts
// ─────────────────────────────────────────────────────────────────────
// Supabase Database TypeScript Definitions
// ─────────────────────────────────────────────────────────────────────

export interface DbCollege {
  id: string;
  name: string;
  created_at: string;
}

export interface DbTeacher {
  id: string;
  college_id: string;
  full_name: string;
  email: string;
}

export interface DbStudent {
  id: string;
  college_id: string;
  full_name: string;
  roll_number: string;
  registered_device_id: string | null;
  created_at: string;
}

export interface DbClass {
  id: string;
  college_id: string;
  teacher_id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
}

export interface DbClassStudent {
  class_id: string;
  student_id: string;
}

export interface DbSession {
  id: string;
  class_id: string;
  started_by: string;
  started_at: string;
  ends_at: string;
  status: "active" | "closed";
}

export interface DbScanToken {
  id: string;
  session_id: string;
  token: string;
  valid_from: string;
  valid_until: string;
  used: boolean;
}

export interface DbAttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "rejected";
  scanned_at: string | null;
  distance_m: number | null;
  device_match: boolean | null;
  reject_reason: string | null;
}

export interface Database {
  public: {
    Tables: {
      colleges: { Row: DbCollege; Insert: Omit<DbCollege, "id" | "created_at">; Update: Partial<DbCollege> };
      teachers: { Row: DbTeacher; Insert: DbTeacher; Update: Partial<DbTeacher> };
      students: { Row: DbStudent; Insert: DbStudent; Update: Partial<DbStudent> };
      classes: { Row: DbClass; Insert: Omit<DbClass, "id">; Update: Partial<DbClass> };
      class_students: { Row: DbClassStudent; Insert: DbClassStudent; Update: Partial<DbClassStudent> };
      sessions: { Row: DbSession; Insert: Omit<DbSession, "id" | "started_at">; Update: Partial<DbSession> };
      scan_tokens: { Row: DbScanToken; Insert: Omit<DbScanToken, "id" | "valid_from">; Update: Partial<DbScanToken> };
      attendance_records: { Row: DbAttendanceRecord; Insert: Omit<DbAttendanceRecord, "id">; Update: Partial<DbAttendanceRecord> };
    };
  };
}
