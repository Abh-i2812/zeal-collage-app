import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateSignedToken } from "@/lib/security/hmacToken";

// Public session metadata is safe to poll from student browsers; the session
// secret remains server-side and only the short-lived signed token is returned.
export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const supabase = getAdminSupabase();
    const { data: row, error } = await supabase.from("sessions")
      .select("id, class_id, started_at, ends_at, status, current_seq, token_secret, latitude, longitude, geofence_radius_m")
      .eq("status", "active").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ success: true, session: null });
    const { data: classRow, error: classError } = await supabase.from("classes")
      .select("subject_id, name, room").eq("id", row.class_id).single();
    if (classError) throw classError;
    const { data: subject, error: subjectError } = await supabase.from("subjects")
      .select("name").eq("id", classRow.subject_id).single();
    if (subjectError) throw subjectError;
    const { data: tokenRow, error: tokenError } = await supabase.from("scan_tokens")
      .select("token_nonce, seq, valid_from, valid_until").eq("session_id", row.id)
      .eq("seq", row.current_seq).maybeSingle();
    if (tokenError) throw tokenError;
    const signedToken = tokenRow ? generateSignedToken(row.id, row.token_secret, tokenRow.seq, 12, tokenRow.token_nonce) : null;
    return NextResponse.json({
      success: true,
      session: {
        sessionId: row.id, subjectId: classRow.subject_id, subject: subject.name,
        teacherId: "", room: classRow.room || classRow.name, latitude: row.latitude,
        longitude: row.longitude, geofenceRadiusM: row.geofence_radius_m,
        createdAt: Math.floor(new Date(row.started_at).getTime() / 1000),
        expiresAt: Math.floor(new Date(row.ends_at).getTime() / 1000), status: row.status,
        tokenIndex: row.current_seq, activeTokenCreatedAt: tokenRow ? Math.floor(new Date(tokenRow.valid_from).getTime() / 1000) : 0,
        activeTokenExpiresAt: tokenRow ? Math.floor(new Date(tokenRow.valid_until).getTime() / 1000) : 0,
        attendance: [], signedToken,
      },
    });
  } catch (error) {
    console.error("GET /api/session/current:", error);
    return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  }
}
