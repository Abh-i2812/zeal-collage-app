import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateSignedToken } from "@/lib/security/hmacToken";

const jsonError = (message: string, status: number, code = "server_error") =>
  NextResponse.json({ success: false, code, error: message }, { status });

async function requireTeacher(req: NextRequest, supabase: any): Promise<string | null> {
  const authorization = req.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  const { data } = await supabase.auth.getUser(authorization.slice(7));
  return data?.user?.id ?? null;
}

function mapSession(row: any, classRow: any, subjectName: string, token: any) {
  const startedAt = Math.floor(new Date(row.started_at).getTime() / 1000);
  const endsAt = Math.floor(new Date(row.ends_at).getTime() / 1000);
  return {
    sessionId: row.id,
    subjectId: classRow.subject_id,
    subject: subjectName,
    teacherId: row.started_by,
    room: classRow.room || "Classroom",
    latitude: row.latitude,
    longitude: row.longitude,
    geofenceRadiusM: row.geofence_radius_m,
    createdAt: startedAt,
    expiresAt: endsAt,
    status: row.status,
    activeTokenCreatedAt: token ? Math.floor(new Date(token.valid_from).getTime() / 1000) : startedAt,
    activeTokenExpiresAt: token ? Math.floor(new Date(token.valid_until).getTime() / 1000) : startedAt + 12,
    tokenIndex: token?.seq ?? row.current_seq ?? 1,
    attendance: [],
    flaggedDevices: {},
    signedToken: token?.signedToken,
  };
}

async function loadClass(supabase: any, classId: string) {
  const result = await supabase
    .from("classes")
    .select("id, subject_id, teacher_id, name, room, latitude, longitude, geofence_radius_m")
    .eq("id", classId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const subject = await supabase.from("subjects").select("name").eq("id", result.data.subject_id).maybeSingle();
  if (subject.error) throw subject.error;
  return { ...result.data, subjectName: subject.data?.name || result.data.name };
}

async function tokenForSession(supabase: any, row: any) {
  const tokenResult = await supabase
    .from("scan_tokens")
    .select("token_nonce, seq, valid_from, valid_until")
    .eq("session_id", row.id)
    .eq("seq", row.current_seq)
    .maybeSingle();
  if (tokenResult.error) throw tokenResult.error;
  if (!tokenResult.data) return null;
  const signedToken = generateSignedToken(
    row.id,
    row.token_secret,
    tokenResult.data.seq,
    Math.max(1, Math.floor((new Date(tokenResult.data.valid_until).getTime() - Date.now()) / 1000)),
    tokenResult.data.token_nonce
  );
  return { ...tokenResult.data, signedToken };
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const supabase = getAdminSupabase();
    const teacherId = await requireTeacher(req, supabase);
    if (!teacherId) return jsonError("A Supabase teacher session is required.", 401, "auth_required");
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    let query = supabase.from("sessions").select("id, class_id, started_by, started_at, ends_at, status, current_seq, token_secret, latitude, longitude, geofence_radius_m");
    if (sessionId) query = query.eq("id", sessionId);
    else if (classId) query = query.eq("class_id", classId).eq("started_by", teacherId).eq("status", "active");
    else query = query.eq("started_by", teacherId).eq("status", "active");
    const { data: row, error } = await query.order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ success: true, session: null, roster: [] });
    const classRow = await loadClass(supabase, row.class_id);
    if (!classRow || classRow.teacher_id !== teacherId) return jsonError("Session is not owned by this teacher.", 403, "forbidden");
    const token = row.status === "active" ? await tokenForSession(supabase, row) : null;
    const { data: enrolled } = await supabase.from("class_students").select("student_id, students(id, full_name, roll_number)").eq("class_id", row.class_id);
    const { data: records } = await supabase.from("attendance_records").select("student_id, status").eq("session_id", row.id);
    const recordMap = new Map((records || []).map((record: any) => [record.student_id, record.status]));
    const roster = (enrolled || []).map((entry: any) => ({
      studentId: entry.student_id,
      name: entry.students?.full_name || entry.students?.roll_number || entry.student_id,
      status: recordMap.get(entry.student_id) === "present" || recordMap.get(entry.student_id) === "late" || recordMap.get(entry.student_id) === "flagged" ? "present" : "unset",
      flagged: recordMap.get(entry.student_id) === "flagged",
    }));
    return NextResponse.json({ success: true, session: mapSession(row, classRow, classRow.subjectName, token), roster });
  } catch (error: any) {
    console.error("GET /api/teacher/session:", error?.message || error);
    return jsonError("Attendance schema is unavailable or the request failed.", 503, "schema_unavailable");
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const body = await req.json();
    const supabase = getAdminSupabase();
    const teacherId = await requireTeacher(req, supabase);
    if (!teacherId) return jsonError("A Supabase teacher session is required.", 401, "auth_required");
    let classId = String(body.classId || "");
    if (!classId) {
      const fallbackClass = await supabase.from("classes").select("id").eq("teacher_id", teacherId).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (fallbackClass.error) throw fallbackClass.error;
      classId = fallbackClass.data?.id || "";
    }
    if (!classId) return jsonError("classId is required (or create a class first).", 400, "missing_params");
    const classRow = await loadClass(supabase, classId);
    if (!classRow || classRow.teacher_id !== teacherId) return jsonError("Class is not owned by this teacher.", 403, "forbidden");
    const existing = await supabase.from("sessions").select("id").eq("class_id", classId).eq("status", "active").maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return jsonError("This class already has an active session.", 409, "active_session_exists");
    const now = new Date();
    const endsAt = new Date(now.getTime() + Math.min(Number(body.durationSeconds) || 360, 7200) * 1000);
    const tokenSecret = crypto.randomBytes(32).toString("hex");
    const sessionResult = await supabase.from("sessions").insert({
      class_id: classId, started_by: teacherId, started_at: now.toISOString(), ends_at: endsAt.toISOString(),
      token_secret: tokenSecret, latitude: Number(body.latitude ?? classRow.latitude), longitude: Number(body.longitude ?? classRow.longitude),
      geofence_radius_m: Number(body.geofenceRadiusM ?? classRow.geofence_radius_m), current_seq: 1,
    }).select("*").single();
    if (sessionResult.error) throw sessionResult.error;
    const validUntil = new Date(now.getTime() + 12_000);
    const token = generateSignedToken(sessionResult.data.id, tokenSecret, 1, 12);
    const tokenResult = await supabase.from("scan_tokens").insert({
      session_id: sessionResult.data.id, token_nonce: token.nonce, seq: 1,
      valid_from: now.toISOString(), valid_until: validUntil.toISOString(),
    });
    if (tokenResult.error) throw tokenResult.error;
    return NextResponse.json({ success: true, session: mapSession(sessionResult.data, classRow, classRow.subjectName, { token_nonce: token.nonce, seq: 1, valid_from: now.toISOString(), valid_until: validUntil.toISOString(), signedToken: token }) });
  } catch (error: any) {
    console.error("POST /api/teacher/session:", error?.message || error);
    return jsonError("Attendance schema is unavailable or the request failed.", 503, "schema_unavailable");
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const body = await req.json();
    const supabase = getAdminSupabase();
    const teacherId = await requireTeacher(req, supabase);
    if (!teacherId) return jsonError("A Supabase teacher session is required.", 401, "auth_required");
    if (!body.sessionId) return jsonError("sessionId is required.", 400, "missing_params");
    if (body.action === "close") {
      const result = await supabase.from("sessions").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", body.sessionId).eq("started_by", teacherId).select("*").single();
      if (result.error) throw result.error;
      return NextResponse.json({ success: true, session: result.data });
    }
    const current = await supabase.from("sessions").select("*").eq("id", body.sessionId).eq("started_by", teacherId).single();
    if (current.error) throw current.error;
    const nextSeq = Number(current.data.current_seq || 1) + 1;
    const now = new Date();
    const validUntil = new Date(now.getTime() + 12_000);
    const signedToken = generateSignedToken(current.data.id, current.data.token_secret, nextSeq, 12);
    const updateResult = await supabase.from("sessions").update({ current_seq: nextSeq }).eq("id", body.sessionId).eq("started_by", teacherId).select("*").single();
    if (updateResult.error) throw updateResult.error;
    const tokenResult = await supabase.from("scan_tokens").insert({
      session_id: current.data.id, token_nonce: signedToken.nonce, seq: nextSeq,
      valid_from: now.toISOString(), valid_until: validUntil.toISOString(),
    });
    if (tokenResult.error) throw tokenResult.error;
    const classRow = await loadClass(supabase, current.data.class_id);
    if (!classRow) throw new Error("class_not_found");
    const token = { token_nonce: signedToken.nonce, seq: nextSeq, valid_from: now.toISOString(), valid_until: validUntil.toISOString(), signedToken };
    const result = { data: { ...updateResult.data, current_seq: nextSeq }, error: null };
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, session: mapSession(result.data, classRow, classRow.subjectName, token) });
  } catch (error: any) {
    console.error("PATCH /api/teacher/session:", error?.message || error);
    return jsonError("Unable to update the attendance session.", 503, "schema_unavailable");
  }
}
