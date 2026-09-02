-- ZCOER QR attendance production schema
-- Run this file in the Supabase SQL editor.  The verify endpoint is the only
-- writer of attendance_records; clients never receive token_secret.

create extension if not exists pgcrypto;

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  attendance_threshold numeric not null default 75,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  full_name text not null,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  full_name text not null,
  roll_number text not null,
  registered_device_id text,
  created_at timestamptz not null default now(),
  unique (college_id, roll_number)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (college_id, code)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  subject_id uuid not null references public.subjects(id),
  code text not null,
  name text not null,
  room text,
  semester int,
  latitude double precision not null,
  longitude double precision not null,
  geofence_radius_m int not null default 60 check (geofence_radius_m between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.class_students (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  started_by uuid not null references public.teachers(id),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  late_after_seconds int not null default 120,
  window_seconds int not null default 360,
  token_secret text not null,
  current_seq int not null default 1,
  latitude double precision not null,
  longitude double precision not null,
  geofence_radius_m int not null default 60,
  status text not null default 'active' check (status in ('active','closed','cancelled')),
  closed_at timestamptz
);

create table if not exists public.scan_tokens (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  token_nonce text not null,
  seq int not null,
  valid_from timestamptz not null default now(),
  valid_until timestamptz not null,
  used boolean not null default false,
  unique (session_id, token_nonce),
  unique (session_id, seq)
);

-- A token is shared by the class. Usage is therefore tracked per student,
-- under a row lock, rather than flipping scan_tokens.used globally.
create table if not exists public.scan_token_uses (
  token_id uuid not null references public.scan_tokens(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key (token_id, student_id)
);

create table if not exists public.scan_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  device_id_hash text,
  token_seq int,
  result text not null,
  reason_code text,
  distance_m double precision,
  gps_accuracy_m double precision,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present','late','flagged','absent','excused','rejected')),
  marked_at timestamptz,
  source text not null default 'scan' check (source in ('scan','auto_absent','manual','leave','dispute')),
  device_id_hash text,
  distance_m double precision,
  gps_accuracy_m double precision,
  device_match boolean,
  trust_score int,
  reason_code text,
  overridden_by uuid references public.teachers(id),
  override_reason text,
  unique (session_id, student_id)
);

create index if not exists classes_teacher_idx on public.classes (teacher_id, created_at desc);
create index if not exists classes_subject_idx on public.classes (subject_id);
create index if not exists class_students_student_idx on public.class_students (student_id, class_id);
create index if not exists sessions_class_status_idx on public.sessions (class_id, status);
create index if not exists sessions_active_idx on public.sessions (started_at desc) where status = 'active';
create unique index if not exists one_active_session_per_class
  on public.sessions (class_id) where status = 'active';
create index if not exists scan_tokens_lookup_idx on public.scan_tokens (session_id, token_nonce, valid_until);
create index if not exists scan_attempts_session_idx on public.scan_attempts (session_id, created_at desc);
create index if not exists attendance_session_student_idx on public.attendance_records (session_id, student_id);
create index if not exists attendance_student_idx on public.attendance_records (student_id, session_id);

-- Atomic, per-student token claim. A class may legitimately reuse one QR token
-- for many students, while a student cannot replay it.
create or replace function public.claim_scan_token(
  p_session_id uuid, p_nonce text, p_student_id uuid
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  token_row public.scan_tokens%rowtype;
begin
  select * into token_row
  from public.scan_tokens
  where session_id = p_session_id and token_nonce = p_nonce
  for update;
  if not found or token_row.used or now() < token_row.valid_from or now() > token_row.valid_until then
    return false;
  end if;
  insert into public.scan_token_uses(token_id, student_id)
  values (token_row.id, p_student_id)
  on conflict (token_id, student_id) do nothing;
  return found;
end;
$$;

alter table public.colleges enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.sessions enable row level security;
alter table public.scan_tokens enable row level security;
alter table public.scan_token_uses enable row level security;
alter table public.scan_attempts enable row level security;
alter table public.attendance_records enable row level security;

-- Make this migration safely repeatable.
drop policy if exists colleges_member_read on public.colleges;
drop policy if exists teachers_self_read on public.teachers;
drop policy if exists students_self_read on public.students;
drop policy if exists subjects_college_read on public.subjects;
drop policy if exists classes_teacher_or_college_read on public.classes;
drop policy if exists teacher_manage_classes on public.classes;
drop policy if exists class_students_member_read on public.class_students;
drop policy if exists sessions_teacher_read on public.sessions;
drop policy if exists teacher_insert_sessions on public.sessions;
drop policy if exists teacher_update_sessions on public.sessions;
drop policy if exists attendance_student_or_teacher_read on public.attendance_records;

create policy colleges_member_read on public.colleges for select
  using (id in (select college_id from public.teachers where id = auth.uid())
      or id in (select college_id from public.students where id = auth.uid()));
create policy teachers_self_read on public.teachers for select using (id = auth.uid());
create policy students_self_read on public.students for select using (id = auth.uid());
create policy subjects_college_read on public.subjects for select
  using (college_id in (select college_id from public.teachers where id = auth.uid())
      or college_id in (select college_id from public.students where id = auth.uid()));
create policy classes_teacher_or_college_read on public.classes for select
  using (teacher_id = auth.uid()
      or college_id in (select college_id from public.teachers where id = auth.uid()));
create policy teacher_manage_classes on public.classes for insert
  with check (teacher_id = auth.uid());
create policy teacher_insert_sessions on public.sessions for insert
  with check (
    started_by = auth.uid()
    and class_id in (select id from public.classes where teacher_id = auth.uid())
  );
create policy class_students_member_read on public.class_students for select
  using (student_id = auth.uid()
      or class_id in (select id from public.classes where teacher_id = auth.uid()));
create policy sessions_teacher_read on public.sessions for select
  using (started_by = auth.uid()
      or class_id in (select id from public.classes where teacher_id = auth.uid()));
create policy teacher_update_sessions on public.sessions for update
  using (started_by = auth.uid())
  with check (started_by = auth.uid());
create policy attendance_student_or_teacher_read on public.attendance_records for select
  using (student_id = auth.uid()
      or session_id in (
        select s.id from public.sessions s
        join public.classes c on c.id = s.class_id
        where c.teacher_id = auth.uid()
      ));

revoke all on function public.claim_scan_token(uuid, text, uuid) from public, anon, authenticated;
