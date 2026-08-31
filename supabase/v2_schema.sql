-- ─────────────────────────────────────────────────────────────────────
-- QR Attendance System v2 — Complete Anti-Proxy Database Schema
-- ─────────────────────────────────────────────────────────────────────

-- 1. ORG & INSTITUTION
create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  attendance_threshold numeric default 75,
  created_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges(id) on delete cascade,
  name text not null
);

-- 2. PEOPLE & PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid references public.colleges(id),
  role text not null check (role in ('student','teacher','hod','admin')),
  full_name text not null,
  email text unique,
  phone text,
  status text not null default 'active'
);

create table if not exists public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  department_id uuid references public.departments(id),
  roll_number text not null,
  batch_year int,
  semester int
);

-- 3. DEVICES & CHANGE REQUESTS
create table if not exists public.student_devices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  device_id text not null,
  user_agent text,
  status text not null default 'active' check (status in ('active','revoked','pending')),
  registered_at timestamptz default now(),
  last_seen_at timestamptz,
  unique (student_id, device_id)
);

create table if not exists public.device_change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  new_device_id text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 4. ACADEMIC STRUCTURE & TIMETABLE
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges(id) on delete cascade,
  name text not null,
  latitude double precision,
  longitude double precision,
  geofence_radius_m int default 60
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges(id) on delete cascade,
  department_id uuid references public.departments(id),
  owner_teacher_id uuid references public.profiles(id),
  code text not null,
  name text not null,
  semester int,
  min_attendance_pct numeric default 75
);

create table if not exists public.class_students (
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  primary key (class_id, student_id)
);

create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  room_id uuid references public.rooms(id),
  day_of_week int check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  auto_open boolean default false
);

-- 5. SESSIONS & ROTATING HMAC TOKENS
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  room_id uuid references public.rooms(id),
  slot_id uuid references public.timetable_slots(id),
  started_by uuid references public.profiles(id),
  delegated_to uuid references public.profiles(id),
  started_at timestamptz default now(),
  ends_at timestamptz not null,
  late_after_seconds int default 120,
  window_seconds int default 360,
  token_secret text not null,
  latitude double precision not null,
  longitude double precision not null,
  geofence_radius_m int not null default 60,
  require_random_recheck boolean default true,
  status text not null default 'active' check (status in ('active','closed','cancelled')),
  closed_at timestamptz
);

-- 6. SCAN ATTEMPTS & AUDIT LOGS
create table if not exists public.scan_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  student_id uuid references public.students(id),
  device_id text,
  token_seq int,
  result text not null,
  reason_code text,
  distance_m double precision,
  gps_accuracy_m double precision,
  ip_hash text,
  created_at timestamptz default now()
);

create index if not exists idx_scan_attempts_session on public.scan_attempts (session_id, created_at desc);

-- 7. ATTENDANCE RECORDS (FINAL TRUTH)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  status text not null check (status in ('present','late','flagged','absent','excused','rejected')),
  marked_at timestamptz,
  source text not null default 'scan' check (source in ('scan','auto_absent','manual','leave','dispute')),
  distance_m double precision,
  device_match boolean,
  trust_score int,
  reason_code text,
  overridden_by uuid references public.profiles(id),
  override_reason text,
  unique (session_id, student_id)
);

create index if not exists idx_attendance_student on public.attendance_records (student_id, session_id);

-- 8. LEAVE, DISPUTES & REPORTS
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  type text not null check (type in ('medical','od','personal')),
  start_date date not null,
  end_date date not null,
  reason text,
  evidence_path text,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.attendance_disputes (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references public.attendance_records(id) on delete cascade,
  student_id uuid references public.students(id),
  message text not null,
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  resolved_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  class_id uuid references public.classes(id),
  session_id uuid references public.sessions(id),
  period_start date,
  period_end date,
  storage_path text not null,
  generated_at timestamptz default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance_records enable row level security;

create policy "Profiles read own" on public.profiles for select using (true);
create policy "Sessions read active" on public.sessions for select using (true);
create policy "Attendance records read" on public.attendance_records for select using (true);
