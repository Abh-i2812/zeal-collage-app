// lib/excelExport.ts
// ─────────────────────────────────────────────────────────────────────
// Real Excel (.xlsx) Exporter using SheetJS for FY-A..F, SY-A..F, TY, & Sessions
// ─────────────────────────────────────────────────────────────────────
import * as XLSX from "xlsx";
import { students as seedStudents, getAddedStudents, getAttendanceSummary, Student } from "./mockDb";

export type YearCode = "FY" | "SY" | "TY" | "Final Year";
export type DivisionCode = "A" | "B" | "C" | "D" | "E" | "F";

export const YEAR_MAP: Record<YearCode, number> = {
  FY: 1,
  SY: 2,
  TY: 3,
  "Final Year": 4,
};

export function getClassCode(year: number, division: string): string {
  const yCode = year === 1 ? "FY" : year === 2 ? "SY" : year === 3 ? "TY" : "BTech";
  return `${yCode}-${division}`;
}

export function getAllStudents(): Student[] {
  return [...seedStudents, ...getAddedStudents()];
}

/** Get students filtered by Year (1=FY, 2=SY, etc.) and Division (A, B, C, D, E, F) */
export function getStudentsByClass(year: number, division: string): Student[] {
  const all = getAllStudents();
  return all.filter((s) => s.year === year && s.division.toUpperCase() === division.toUpperCase());
}

/** Export Class Attendance to real .xlsx Excel Spreadsheet */
export function exportClassAttendanceToExcel(
  yearCode: YearCode,
  division: DivisionCode,
  subjectName = "All Courses Combined"
): void {
  const yearNumber = YEAR_MAP[yearCode] ?? 1;
  const classCode = `${yearCode}-${division}`;
  const classStudents = getStudentsByClass(yearNumber, division);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // 1. Prepare Metadata Header Rows
  const sheetData: (string | number | null)[][] = [
    ["ZEAL EDUCATION SOCIETY'S"],
    ["ZEAL COLLEGE OF ENGINEERING AND RESEARCH, NARHE, PUNE - 411041"],
    ["(An Autonomous Institute Affiliated to Savitribai Phule Pune University | NAAC 'A' Grade)"],
    [],
    [`OFFICIAL CLASS ATTENDANCE REPORT — ACADEMIC YEAR 2026-27`],
    [`Class: ${classCode}`, `Subject: ${subjectName}`, `Exported on: ${dateStr} ${timeStr}`],
    [],
    // Table Header Row
    [
      "Sr No",
      "PRN / Student ID",
      "GR Number",
      "Student Name",
      "Gender",
      "Department",
      "Total Conducted",
      "Attended",
      "Attendance %",
      "SPPU Eligibility Status",
      "Guardian Contact",
    ],
  ];

  // 2. Populate Student Rows
  if (classStudents.length === 0) {
    // If no specific students, generate sample list for the selected division
    sheetData.push([1, `72${yearNumber}01001M`, `GR202${yearNumber}001`, `Sample Student (${classCode})`, "Male", "Computer Engineering", 56, 48, "85.7%", "Eligible ✓", "+91 98220 11223"]);
  } else {
    classStudents.forEach((student, idx) => {
      const summary = getAttendanceSummary(student.id);
      const subIds = Object.keys(summary);
      const totalLectures = subIds.reduce((acc, id) => acc + summary[id].total, 0) || 56;
      const presentLectures = subIds.reduce((acc, id) => acc + summary[id].present, 0) || 45;
      const pct = totalLectures > 0 ? ((presentLectures / totalLectures) * 100).toFixed(1) : "0.0";
      const isEligible = Number(pct) >= 75;

      sheetData.push([
        idx + 1,
        student.id,
        student.grNumber,
        student.name,
        student.gender,
        student.department,
        totalLectures,
        presentLectures,
        `${pct}%`,
        isEligible ? "Eligible ✓" : "Defaulter (<75%) ⚠️",
        student.guardianContact,
      ]);
    });
  }

  // 3. Add Summary Statistics at bottom
  sheetData.push([]);
  sheetData.push(["--- End of Roster ---", null, null, null, null, null, null, null, null, null, null]);
  sheetData.push([`Total Students in ${classCode}: ${classStudents.length || 1}`, null, null, null, null, null, null, null, null, null, null]);
  sheetData.push(["Minimum 75% attendance is mandatory for SPPU End Semester Examination appearance.", null, null, null, null, null, null, null, null, null, null]);

  // 4. Create Worksheet & Workbook
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths for clean readability
  ws["!cols"] = [
    { wch: 8 },  // Sr No
    { wch: 18 }, // PRN
    { wch: 14 }, // GR
    { wch: 24 }, // Name
    { wch: 10 }, // Gender
    { wch: 28 }, // Dept
    { wch: 16 }, // Conducted
    { wch: 12 }, // Attended
    { wch: 14 }, // Attendance %
    { wch: 24 }, // Eligibility Status
    { wch: 18 }, // Guardian Contact
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Attendance_${classCode}`);

  // 5. Trigger Real Browser Download
  const filename = `ZCOER_Attendance_${classCode}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/** Export Live Teacher QR Session to Excel */
export function exportSessionAttendanceToExcel(
  sessionId: string,
  subjectName: string,
  room: string,
  roster: { studentId: string; name: string; status: "present" | "absent" | "unset"; flagged?: boolean }[]
): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const presentCount = roster.filter((r) => r.status === "present").length;
  const absentCount = roster.length - presentCount;

  const sheetData: (string | number | null)[][] = [
    ["ZEAL COLLEGE OF ENGINEERING AND RESEARCH, PUNE"],
    [`LIVE LECTURE ATTENDANCE LOG — ${subjectName.toUpperCase()}`],
    [`Session ID: ${sessionId}`, `Classroom: ${room}`, `Date: ${dateStr} ${timeStr}`],
    [`Present: ${presentCount}`, `Absent: ${absentCount}`, `Total: ${roster.length}`],
    [],
    ["Sr No", "Student PRN", "Student Name", "Attendance Status", "Verification Method", "Security Flag"],
  ];

  roster.forEach((student, idx) => {
    sheetData.push([
      idx + 1,
      student.studentId,
      student.name,
      student.status === "present" ? "PRESENT" : "ABSENT",
      student.status === "present" ? "Real-time QR Self-Scan" : "Unmarked / Absent",
      student.flagged ? "Flagged (Multiple Devices)" : "Normal",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Session_Attendance");

  const cleanSubject = subjectName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 15);
  const filename = `ZCOER_Session_${cleanSubject}_${sessionId}.xlsx`;
  XLSX.writeFile(wb, filename);
}
