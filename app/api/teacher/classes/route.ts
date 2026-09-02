import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

async function teacherId(req: NextRequest, supabase: any) {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const { data } = await supabase.auth.getUser(header.slice(7));
  return data?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const supabase = getAdminSupabase();
    const id = await teacherId(req, supabase);
    if (!id) return NextResponse.json({ error: "Authentication required", code: "auth_required" }, { status: 401 });
    const { data, error } = await supabase.from("classes").select("id, code, name, room, subject_id, latitude, longitude, geofence_radius_m").eq("teacher_id", id).order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, classes: data || [] });
  } catch (error) {
    console.error("GET /api/teacher/classes:", error);
    return NextResponse.json({ error: "Attendance schema is unavailable", code: "schema_unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, code: "schema_unavailable" }, { status: 503 });
  try {
    const body = await req.json();
    const supabase = getAdminSupabase();
    const id = await teacherId(req, supabase);
    if (!id) return NextResponse.json({ error: "Authentication required", code: "auth_required" }, { status: 401 });
    if (!body.subjectId || !body.code || !body.name) {
      return NextResponse.json({ error: "subjectId, code and name are required", code: "missing_params" }, { status: 400 });
    }
    if (!Number.isFinite(Number(body.latitude)) || !Number.isFinite(Number(body.longitude))) {
      return NextResponse.json({ error: "Class latitude and longitude are required", code: "missing_params" }, { status: 400 });
    }
    const { data: teacher } = await supabase.from("teachers").select("college_id").eq("id", id).single();
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found", code: "forbidden" }, { status: 403 });
    const result = await supabase.from("classes").insert({
      college_id: teacher.college_id, teacher_id: id, subject_id: body.subjectId, code: body.code,
      name: body.name, room: body.room || null, semester: body.semester || null,
      latitude: Number(body.latitude), longitude: Number(body.longitude), geofence_radius_m: Number(body.geofenceRadiusM || 60),
    }).select("*").single();
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, class: result.data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teacher/classes:", error);
    return NextResponse.json({ error: "Unable to create class", code: "schema_unavailable" }, { status: 503 });
  }
}
