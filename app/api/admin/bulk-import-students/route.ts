import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

interface ImportRow {
  zprn: string;
  name: string;
  division?: string;
  classId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rows, classId, dryRun = false }: { rows: ImportRow[]; classId?: string; dryRun?: boolean } = body;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Validate rows
    const valid: ImportRow[] = [];
    const invalid: { row: ImportRow; reason: string }[] = [];

    for (const row of rows) {
      if (!row.zprn || row.zprn.trim().length < 5) {
        invalid.push({ row, reason: "Invalid or missing ZPRN" });
        continue;
      }
      if (!row.name || row.name.trim().length < 2) {
        invalid.push({ row, reason: "Invalid or missing student name" });
        continue;
      }
      valid.push({ ...row, zprn: row.zprn.trim().toUpperCase(), name: row.name.trim() });
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalRows: rows.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        preview: valid.slice(0, 20),
        errors: invalid,
      });
    }

    // Check for existing students with same ZPRN
    const zprnList = valid.map((r) => r.zprn);
    const { data: existingStudents } = await supabase
      .from("students")
      .select("roll_number")
      .in("roll_number", zprnList);
    const existingZPRNs = new Set((existingStudents || []).map((s: { roll_number: string }) => s.roll_number));

    const toInsert = valid.filter((r) => !existingZPRNs.has(r.zprn));
    const skipped = valid.filter((r) => existingZPRNs.has(r.zprn));

    let inserted = 0;
    let enrolledInClass = 0;

    // Insert students (we need a profile first per v2 schema, but for now insert directly into students table)
    for (const row of toInsert) {
      // Insert into students table directly with roll_number
      const { data: newStudent, error: insertErr } = await supabase
        .from("students")
        .insert({
          roll_number: row.zprn,
          full_name: row.name,
          division: row.division || "A",
        })
        .select("id")
        .maybeSingle();

      if (insertErr || !newStudent) continue;
      inserted++;

      // Enroll in class if classId provided
      if (classId && newStudent.id) {
        await supabase
          .from("class_students")
          .insert({ class_id: classId, student_id: newStudent.id })
          .catch(() => {});
        enrolledInClass++;
      }
    }

    // Also enroll existing students in the class if classId provided
    if (classId && skipped.length > 0) {
      const { data: existingData } = await supabase
        .from("students")
        .select("id")
        .in("roll_number", skipped.map((s) => s.zprn));
      if (existingData) {
        for (const s of existingData as { id: string }[]) {
          await supabase
            .from("class_students")
            .upsert({ class_id: classId, student_id: s.id })
            .catch(() => {});
          enrolledInClass++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      inserted,
      skipped: skipped.length,
      enrolledInClass,
      invalidCount: invalid.length,
      errors: invalid,
    });
  } catch (err: unknown) {
    console.error("Bulk import error:", err);
    return NextResponse.json({ error: "Failed to import students" }, { status: 500 });
  }
}
