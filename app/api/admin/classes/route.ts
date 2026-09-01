import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("classes")
      .select("id, code, name, semester, latitude, longitude, geofence_radius_m, owner_teacher_id, profiles(full_name)")
      .order("name");

    if (error) throw error;

    // Get enrolled student counts per class
    const classIds = (data || []).map((c: { id: string }) => c.id);
    let enrolledCounts: Record<string, number> = {};
    if (classIds.length > 0) {
      const { data: enrollData } = await supabase
        .from("class_students")
        .select("class_id");
      if (enrollData) {
        for (const row of enrollData as { class_id: string }[]) {
          enrolledCounts[row.class_id] = (enrolledCounts[row.class_id] || 0) + 1;
        }
      }
    }

    const classes = (data || []).map((c: {
      id: string;
      code: string;
      name: string;
      semester: number;
      latitude: number | null;
      longitude: number | null;
      geofence_radius_m: number;
      owner_teacher_id: string;
      profiles: { full_name: string } | null;
    }) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      semester: c.semester,
      latitude: c.latitude,
      longitude: c.longitude,
      geofenceRadiusM: c.geofence_radius_m,
      teacherName: c.profiles?.full_name || "—",
      enrolledCount: enrolledCounts[c.id] || 0,
    }));

    return NextResponse.json({ classes });
  } catch (err) {
    console.error("GET /api/admin/classes error:", err);
    return NextResponse.json({ classes: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, semester, latitude, longitude, geofenceRadiusM = 5, collegeId, departmentId } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Class name and code are required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("classes")
      .insert({
        code,
        name,
        semester: semester || null,
        latitude: latitude || null,
        longitude: longitude || null,
        geofence_radius_m: geofenceRadiusM,
        college_id: collegeId || "e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1",
        department_id: departmentId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, class: data });
  } catch (err: unknown) {
    console.error("POST /api/admin/classes error:", err);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, code, latitude, longitude, geofenceRadiusM } = body;
    if (!id) return NextResponse.json({ error: "Missing class id" }, { status: 400 });

    const supabase = getAdminSupabase();
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (code) updates.code = code;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (geofenceRadiusM !== undefined) updates.geofence_radius_m = geofenceRadiusM;

    const { data, error } = await supabase.from("classes").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, class: data });
  } catch (err: unknown) {
    console.error("PUT /api/admin/classes error:", err);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}
