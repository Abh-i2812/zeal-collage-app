import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // 1. Fetch Session details
    const { data: sessionData, error: sessErr } = await supabase
      .from("sessions")
      .select("id, class_id, status")
      .eq("id", sessionId)
      .single();

    if (sessErr || !sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. Fetch all enrolled students for this class
    const { data: classStudents } = await supabase
      .from("class_students")
      .select("student_id")
      .eq("class_id", sessionData.class_id);

    // 3. Fetch students who already scanned
    const { data: existingRecords } = await supabase
      .from("attendance_records")
      .select("student_id")
      .eq("session_id", sessionId);

    const scannedStudentIds = new Set((existingRecords || []).map((r: { student_id: string }) => r.student_id));
    const enrolledStudentIds = (classStudents || []).map((cs: { student_id: string }) => cs.student_id);

    const absentStudentIds = enrolledStudentIds.filter((id: string) => !scannedStudentIds.has(id));

    // 4. Batch insert absent records
    if (absentStudentIds.length > 0) {
      const absentRows = absentStudentIds.map((studentId: string) => ({
        session_id: sessionId,
        student_id: studentId,
        status: "absent",
        reject_reason: "Did not scan before session window closed",
      }));

      await supabase.from("attendance_records").insert(absentRows).catch(() => {});
    }

    // 5. Close the session
    await supabase
      .from("sessions")
      .update({ status: "closed" })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      totalAbsentMarked: absentStudentIds.length,
      status: "closed",
    });
  } catch (err: unknown) {
    console.error("Auto-absent API error:", err);
    return NextResponse.json({ error: "Failed to run auto-absent job" }, { status: 500 });
  }
}
