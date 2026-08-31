import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";
import { generateExcelV2WorkbookBuffer, AttendanceV2ExportItem } from "@/lib/export/excelExporterV2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, className = "CS301_Data_Structures", sessionDate = new Date().toISOString().split("T")[0], records: inlineRecords } = body;

    let exportRecords: AttendanceV2ExportItem[] = [];

    if (sessionId) {
      const supabase = getAdminSupabase();
      const { data } = await supabase
        .from("attendance_records")
        .select("status, marked_at, distance_m, device_match, trust_score, reason_code, overridden_by, students(roll_number, full_name)")
        .eq("session_id", sessionId);

      if (data && data.length > 0) {
        exportRecords = data.map((r: any) => {
          const studentInfo = r.students as unknown as { roll_number: string; full_name: string } | null;
          return {
            rollNumber: studentInfo?.roll_number || "—",
            fullName: studentInfo?.full_name || "Student",
            status: r.status as "present" | "late" | "flagged" | "absent" | "excused" | "rejected",
            scannedAt: r.marked_at ? new Date(r.marked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null,
            isLate: r.status === "late",
            distanceM: r.distance_m,
            deviceMatch: r.device_match,
            trustScore: r.trust_score || 100,
            reasonCode: r.reason_code || "verified",
            overriddenBy: r.overridden_by || null,
          };
        });
      }
    }

    if (exportRecords.length === 0) {
      exportRecords = inlineRecords && inlineRecords.length > 0 ? inlineRecords : [
        { rollNumber: "225P10229R", fullName: "Aarav Patil", status: "present", scannedAt: "10:02:14 AM", distanceM: 14.2, deviceMatch: true, trustScore: 100, reasonCode: "verified" },
        { rollNumber: "225P10241R", fullName: "Aditya Shinde", status: "present", scannedAt: "10:03:05 AM", distanceM: 28.5, deviceMatch: true, trustScore: 95, reasonCode: "verified" },
        { rollNumber: "225P10256R", fullName: "Rohan Jadhav", status: "late", scannedAt: "10:06:12 AM", isLate: true, distanceM: 32.1, deviceMatch: true, trustScore: 85, reasonCode: "past_late_cutoff" },
        { rollNumber: "225P10273R", fullName: "Omkar More", status: "flagged", scannedAt: "10:04:12 AM", distanceM: 85.8, deviceMatch: true, trustScore: 60, reasonCode: "gps_accuracy_poor" },
        { rollNumber: "225P10288R", fullName: "Vedant Kulkarni", status: "absent", scannedAt: null, distanceM: null, deviceMatch: null, trustScore: 0, reasonCode: "auto_absent" },
      ];
    }

    const buffer = await generateExcelV2WorkbookBuffer(
      {
        className,
        sessionDate,
        totalStudents: exportRecords.length,
      },
      exportRecords
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${className}_Attendance_v2_${sessionDate}.xlsx"`,
      },
    });
  } catch (err: unknown) {
    console.error("v2 Excel export error:", err);
    return NextResponse.json({ error: "Failed to generate Excel v2 file" }, { status: 500 });
  }
}
