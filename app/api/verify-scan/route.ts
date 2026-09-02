import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { verifySignedToken, SignedQRPayload } from "@/lib/security/hmacToken";
import { calculateHaversineDistance } from "@/lib/geo/haversine";

type ScanResult = {
  success: boolean;
  status: "present" | "late" | "flagged" | "rejected" | "already_marked";
  reasonCode: string;
  message: string;
  distanceM: number;
  trustScore: number;
  deviceMatch: boolean;
  retryable: boolean;
};

const rejected = (reasonCode: string, message: string, retryable = false, distanceM = 0): ScanResult => ({
  success: false, status: "rejected", reasonCode, message, distanceM, trustScore: 0, deviceMatch: false, retryable,
});

async function authenticatedStudent(req: NextRequest, supabase: any): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const { data } = await supabase.auth.getUser(header.slice(7));
  return data?.user?.id ?? null;
}

function hash(value: string | null | undefined) {
  return value ? crypto.createHash("sha256").update(value).digest("hex") : null;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rejected("invalid_request", "Request body must be valid JSON."), { status: 400 });
  }

  // A missing migration is an intentional, detectable signal for the demo
  // client, which then uses its localStorage implementation.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, code: "schema_unavailable", error: "Supabase is not configured." }, { status: 503 });
  }

  let supabase: any;
  let sessionId = String(body.sessionId || "");
  try {
    supabase = getAdminSupabase();
    const studentId = await authenticatedStudent(req, supabase);
    if (!studentId) {
      return NextResponse.json(rejected("auth_required", "Sign in with your student account before scanning.", false), { status: 401 });
    }
    // Client-supplied studentId is deliberately ignored when a JWT is present.
    const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
    const cookieDeviceId = req.cookies.get("zcoer_device_id")?.value;
    if (cookieDeviceId && deviceId && cookieDeviceId !== deviceId) {
      return NextResponse.json(rejected("device_cookie_mismatch", "Your device identity changed. Request a device change from your teacher.", false), { status: 403 });
    }
    const deviceHash = hash(deviceId);
    const token = (body.signedToken && typeof body.signedToken === "object" ? body.signedToken : body.token) as SignedQRPayload;

    const sessionQuery = await supabase.from("sessions").select(
      "id, class_id, started_at, ends_at, late_after_seconds, current_seq, token_secret, latitude, longitude, geofence_radius_m, status"
    ).eq("id", sessionId).maybeSingle();
    if (sessionQuery.error) throw sessionQuery.error;
    const session = sessionQuery.data;
    if (!session || session.status !== "active" || Date.now() > new Date(session.ends_at).getTime()) {
      const result = rejected("session_closed", "Attendance session is closed or expired.");
      if (session) await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    const enrollment = await supabase.from("class_students").select("student_id").eq("class_id", session.class_id).eq("student_id", studentId).maybeSingle();
    if (enrollment.error) throw enrollment.error;
    if (!enrollment.data) {
      const result = rejected("not_enrolled", "You are not enrolled in this class.", false);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    if (!token || token.sessionId !== session.id || !token.nonce || !Number.isFinite(token.seq)) {
      const result = rejected("token_invalid", "This QR token is not valid.", true);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }
    const tokenCheck = verifySignedToken(token, session.token_secret);
    if (!tokenCheck.valid) {
      const result = rejected(tokenCheck.reason || "token_invalid", tokenCheck.reason === "token_expired" ? "QR code expired. Scan the current code." : "QR signature is invalid.", true);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }
    if (token.seq < Number(session.current_seq || 1) - 1) {
      const result = rejected("stale_token", "This QR code is stale. Scan the current code.", true);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const accuracy = Number(body.gpsAccuracyM ?? 20);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      const result = rejected("location_unavailable", "Location permission is required to mark attendance.", true);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }
    const distanceM = calculateHaversineDistance(
      { latitude, longitude },
      { latitude: session.latitude, longitude: session.longitude }
    );
    if (distanceM > Number(session.geofence_radius_m)) {
      const result = rejected("outside_range", `You are ${Math.round(distanceM)}m from the classroom; move inside the geofence.`, true, distanceM);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    const student = await supabase.from("students").select("registered_device_id").eq("id", studentId).maybeSingle();
    if (student.error) throw student.error;
    const registeredDevice = student.data?.registered_device_id;
    if (registeredDevice && registeredDevice !== deviceHash) {
      const result = { ...rejected("device_mismatch", "This phone is not bound to your account. Request a device change from your teacher.", false, distanceM), trustScore: 20 };
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }
    if (!registeredDevice && deviceHash) {
      // Conditional update prevents two concurrent first scans from rebinding
      // the account to different devices.
      await supabase.from("students").update({ registered_device_id: deviceHash }).eq("id", studentId).is("registered_device_id", null);
    }

    const reused = await supabase.from("attendance_records").select("student_id").eq("session_id", session.id).eq("device_id_hash", deviceHash).neq("student_id", studentId).limit(1).maybeSingle();
    if (reused.error) throw reused.error;
    if (reused.data) {
      const result = rejected("device_reused", "This device has already been used by another student in this session.", false, distanceM);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    const duplicate = await supabase.from("attendance_records").select("marked_at, status").eq("session_id", session.id).eq("student_id", studentId).maybeSingle();
    if (duplicate.error) throw duplicate.error;
    if (duplicate.data) {
      const result: ScanResult = { success: true, status: "already_marked", reasonCode: "already_marked", message: "Attendance is already recorded for this session.", distanceM, trustScore: 100, deviceMatch: true, retryable: false };
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    // The RPC locks the token row and atomically records this student's use.
    // If an older migration has no RPC, the clear server error tells operators
    // to install schema.sql rather than silently weakening verification.
    const claim = await supabase.rpc("claim_scan_token", { p_session_id: session.id, p_nonce: token.nonce, p_student_id: studentId });
    if (claim.error) throw claim.error;
    if (!claim.data) {
      const result = rejected("token_used", "This token was already used or is no longer valid. Scan the current code.", true, distanceM);
      await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
      return NextResponse.json(result);
    }

    let trustScore = 100;
    if (!Number.isFinite(accuracy) || accuracy > 100) trustScore -= 25;
    if (token.seq < Number(session.current_seq || 1)) trustScore -= 10;
    const flagged = trustScore < 70;
    const late = Date.now() > new Date(session.started_at).getTime() + Number(session.late_after_seconds || 120) * 1000;
    const status = flagged ? "flagged" : late ? "late" : "present";
    const result: ScanResult = {
      success: true, status, reasonCode: flagged ? "gps_accuracy_low" : "verified",
      message: flagged ? "Attendance recorded and flagged for teacher review." : "Attendance verified successfully.",
      distanceM, trustScore, deviceMatch: true, retryable: false,
    };
    await logAttempt(supabase, body, session.id, studentId, deviceHash, result);
    const inserted = await supabase.from("attendance_records").insert({
      session_id: session.id, student_id: studentId, status, marked_at: new Date().toISOString(),
      source: "scan", device_id_hash: deviceHash, distance_m: distanceM, gps_accuracy_m: accuracy,
      device_match: true, trust_score: trustScore, reason_code: result.reasonCode,
    });
    if (inserted.error) {
      if (inserted.error.code === "23505") {
        return NextResponse.json({ ...result, status: "already_marked", reasonCode: "already_marked", message: "Attendance is already recorded for this session." });
      }
      throw inserted.error;
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/verify-scan:", error?.message || error);
    const missingSchema = /relation|function|column|schema/i.test(String(error?.message || ""));
    return NextResponse.json(
      { success: false, code: missingSchema ? "schema_unavailable" : "server_error", status: "rejected", reasonCode: missingSchema ? "schema_unavailable" : "server_error", message: missingSchema ? "Attendance schema is not installed. Use the demo fallback or install supabase/schema.sql." : "Attendance verification failed. Please try again.", retryable: true },
      { status: missingSchema ? 503 : 500 }
    );
  }
}

async function logAttempt(supabase: any, body: any, sessionId: string, studentId: string, deviceHash: string | null, result: ScanResult) {
  try {
    await supabase.from("scan_attempts").insert({
      session_id: sessionId, student_id: studentId, device_id_hash: deviceHash,
      token_seq: body.signedToken?.seq ?? null, result: result.status, reason_code: result.reasonCode,
      distance_m: result.distanceM, gps_accuracy_m: Number(body.gpsAccuracyM ?? 20),
      ip_hash: hash(body.ipAddress),
    });
  } catch {
    // Verification result must not be changed by an audit-log failure.
  }
}
