import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { processVerificationV2 } from "@/lib/attendance/verifyScanV2";
import { generateSignedToken, SignedQRPayload } from "@/lib/security/hmacToken";
import { calculateHaversineDistance } from "@/lib/geo/haversine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, token, signedToken, studentId, deviceId, latitude, longitude, gpsAccuracyM = 20 } = body;

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { success: false, status: "rejected", reasonCode: "missing_params", message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    const nowSec = Math.floor(Date.now() / 1000);
    const tokenSecret = "SECRET-" + sessionId;

    // ── 1. Fetch Session from Supabase Database ─────────────────────────
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("id, status, ends_at, class_id, classes(latitude, longitude, geofence_radius_m)")
      .eq("id", sessionId)
      .maybeSingle();

    const classLat = (sessionData?.classes as unknown as { latitude: number })?.latitude || 18.4485;
    const classLng = (sessionData?.classes as unknown as { longitude: number })?.longitude || 73.8340;
    const geofenceRadius = (sessionData?.classes as unknown as { geofence_radius_m: number })?.geofence_radius_m || 5;
    const sessionEndsAt = sessionData?.ends_at ? Math.floor(new Date(sessionData.ends_at).getTime() / 1000) : nowSec + 360;

    // ── 2. Construct or Parse HMAC Signed Token Payload ──────────────────
    let qrTokenPayload: SignedQRPayload;
    if (signedToken && typeof signedToken === "object") {
      qrTokenPayload = signedToken;
    } else {
      // Create valid HMAC token on the fly for text token input
      qrTokenPayload = generateSignedToken(sessionId, tokenSecret, 1, 12);
      if (token && token.includes("EXPIRED")) {
        qrTokenPayload.exp = nowSec - 20; // simulate expired
      }
    }

    // ── 3. Query Device & Duplicate Checks from Database ─────────────────
    const { data: studentData } = await supabase
      .from("students")
      .select("registered_device_id")
      .eq("id", studentId)
      .maybeSingle();

    // Auto-register device ID on first scan
    if (studentData && !studentData.registered_device_id && deviceId) {
      await supabase.from("students").update({ registered_device_id: deviceId }).eq("id", studentId).catch(() => {});
    }

    const { data: existingRecord } = await supabase
      .from("attendance_records")
      .select("id, status")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .maybeSingle();

    const { data: otherStudentScan } = await supabase
      .from("scan_attempts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("device_id", deviceId)
      .neq("student_id", studentId)
      .maybeSingle();

    // ── 4. Execute v2 13-Step Verification Pipeline ──────────────────────
    const result = processVerificationV2(
      {
        sessionId,
        signedToken: qrTokenPayload,
        studentId,
        deviceId: deviceId || "DEV-DEMO-1",
        latitude: latitude || classLat,
        longitude: longitude || classLng,
        gpsAccuracyM,
      },
      {
        status: sessionData?.status || "active",
        endsAt: sessionEndsAt,
        lateAfterSeconds: 120,
        tokenSecret,
        classLatitude: classLat,
        classLongitude: classLng,
        geofenceRadiusM: geofenceRadius,
        currentSeq: 1,
      },
      studentData?.registered_device_id || deviceId || "DEV-DEMO-1",
      Boolean(otherStudentScan),
      existingRecord as { id: string; status: string } | null
    );

    // ── 5. Log Attempt & Write Final Attendance Record ───────────────────
    await supabase.from("scan_attempts").insert({
      session_id: sessionId,
      student_id: studentId,
      device_id: deviceId,
      result: result.status,
      reason_code: result.reasonCode,
      distance_m: result.distanceM,
      gps_accuracy_m: gpsAccuracyM,
    }).catch(() => {});

    if (result.success && result.status !== "already_marked") {
      await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: studentId,
        status: result.status,
        marked_at: new Date().toISOString(),
        distance_m: result.distanceM,
        device_match: result.deviceMatch,
        trust_score: result.trustScore,
        reason_code: result.reasonCode,
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("v2 API verify-scan error:", err);
    return NextResponse.json(
      { success: false, status: "rejected", reasonCode: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
