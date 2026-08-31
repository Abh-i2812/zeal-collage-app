-- SQL Schema for ZCOER QR Attendance System
-- Supabase / Postgres Database Schema with Row Level Security (RLS)

-- 1. Colleges
create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Teachers
create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid references public.colleges(id),
  full_name text not null,
  email text unique not null
);

-- 3. Students
create table if not exists public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid references public.colleges(id),
  full_name text not null,
  roll_number text not null,
  registered_device_id text, -- captured on first login for device binding
  created_at timestamptz default now()
);

-- 4. Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references public.colleges(id),
  teacher_id uuid references public.teachers(id),
  name text not null, -- e.g. "CS301 - Data Structures"
  latitude double precision not null, -- classroom location
  longitude double precision not null,
  geofence_radius_m int default 60
);

-- 5. Class Students
create table if not exists public.class_students (
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  primary key (class_id, student_id)
);

-- 6. Sessions
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  started_by uuid references public.teachers(id),
  started_at timestamptz default now(),
  ends_at timestamptz not null, -- started_at + 6 minutes (configurable)
  status text default 'active' -- 'active' | 'closed'
);

-- 7. Scan Tokens
create table if not exists public.scan_tokens (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  token text not null, -- random string encoded in the QR
  valid_from timestamptz default now(),
  valid_until timestamptz not null, -- valid_from + ~12 seconds
  used boolean default false
);

-- 8. Attendance Records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  status text not null, -- 'present' | 'absent' | 'rejected'
  scanned_at timestamptz,
  distance_m double precision,
  device_match boolean,
  reject_reason text, -- null when present
  unique (session_id, student_id)
);

-- INDEXES for fast querying
create index if not exists idx_scan_tokens_lookup on public.scan_tokens (session_id, token);
create index if not exists idx_attendance_session_student on public.attendance_records (session_id, student_id);
create index if not exists idx_sessions_class_status on public.sessions (class_id, status);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.colleges enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.sessions enable row level security;
alter table public.scan_tokens enable row level security;
alter table public.attendance_records enable row level security;

-- Public read for demo / college info
create policy "Allow read access to colleges" on public.colleges for select using (true);
create policy "Allow read access to classes" on public.classes for select using (true);
create policy "Allow read access to scan_tokens" on public.scan_tokens for select using (true);
create policy "Allow read access to sessions" on public.sessions for select using (true);

-- Teacher access policies
create policy "Teachers read own data" on public.teachers for select using (auth.uid() = id);
create policy "Teachers read/manage own sessions" on public.sessions for all using (auth.uid() = started_by);
create policy "Teachers read own attendance records" on public.attendance_records for select using (
  exists (select 1 from public.sessions s where s.id = session_id and s.started_by = auth.uid())
);

-- Student access policies
create policy "Students read own data" on public.students for select using (auth.uid() = id);
create policy "Students write own attendance record" on public.attendance_records for insert with check (
  auth.uid() = student_id
);

-- Auto-absent trigger / function (when session ends)
create or replace function mark_absent_students_for_session(target_session_id uuid)
returns void language plpgsql security definer as $$
declare
  target_class_id uuid;
begin
  select class_id into target_class_id from public.sessions where id = target_session_id;
  
  insert into public.attendance_records (session_id, student_id, status, reject_reason)
  select target_session_id, cs.student_id, 'absent', 'Did not scan during session'
  from public.class_students cs
  where cs.class_id = target_class_id
    and not exists (
      select 1 from public.attendance_records ar 
      where ar.session_id = target_session_id and ar.student_id = cs.student_id
    );

  update public.sessions set status = 'closed' where id = target_session_id;
end;
$$;
