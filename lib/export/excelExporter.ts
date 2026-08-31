// lib/export/excelExporter.ts
// ─────────────────────────────────────────────────────────────────────
// ExcelJS Exporter matching exact spec in Section 8
// ─────────────────────────────────────────────────────────────────────
import ExcelJS from "exceljs";

export interface AttendanceExportItem {
  rollNumber: string;
  fullName: string;
  status: "present" | "absent" | "rejected";
  scannedAt?: string | null;
  distanceM?: number | null;
  deviceMatch?: boolean | null;
  rejectReason?: string | null;
}

export interface SessionExportMetadata {
  className: string;
  sessionDate: string;
  totalStudents: number;
}

/** Sanitize string to 31 chars max for Excel sheet name */
export function sanitizeSheetName(rawName: string): string {
  return rawName.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31);
}

export async function generateExcelWorkbookBuffer(
  meta: SessionExportMetadata,
  records: AttendanceExportItem[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZCOER Attendance System";
  workbook.lastModifiedBy = "ZCOER System";
  workbook.created = new Date();

  const sheetName = sanitizeSheetName(`${meta.className}_${meta.sessionDate}`);
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }], // Freeze pane below row 1
  });

  // Columns spec: Roll No (12), Name (28), Status (12), Scan time (20), Distance (m) (12), Device match (14), Reason (24)
  worksheet.columns = [
    { header: "Roll No", key: "rollNumber", width: 12 },
    { header: "Name", key: "fullName", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "Scan time", key: "scannedAt", width: 20 },
    { header: "Distance (m)", key: "distanceM", width: 12 },
    { header: "Device match", key: "deviceMatch", width: 14 },
    { header: "Reject reason", key: "rejectReason", width: 24 },
  ];

  // Header Row Formatting: bold, fill #305496, white text
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" }, name: "Calibri", size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "305496" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  let presentCount = 0;
  let absentCount = 0;
  let rejectedCount = 0;

  // Thin border style
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "D9D9D9" } },
    left: { style: "thin", color: { argb: "D9D9D9" } },
    bottom: { style: "thin", color: { argb: "D9D9D9" } },
    right: { style: "thin", color: { argb: "D9D9D9" } },
  };

  // Populate Data Rows
  records.forEach((r) => {
    const isPresent = r.status === "present";
    if (isPresent) presentCount++;
    else if (r.status === "absent") absentCount++;
    else rejectedCount++;

    const row = worksheet.addRow({
      rollNumber: r.rollNumber,
      fullName: r.fullName,
      status: r.status.toUpperCase(),
      scannedAt: r.scannedAt || "—",
      distanceM: r.distanceM !== null && r.distanceM !== undefined ? r.distanceM : "—",
      deviceMatch: r.deviceMatch === true ? "MATCH" : r.deviceMatch === false ? "MISMATCH" : "—",
      rejectReason: r.rejectReason || "—",
    });

    row.height = 20;

    // Apply Present vs Absent/Rejected Fills and Font Colors
    if (isPresent) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C6EFCE" }, // Fill #C6EFCE
      };
      row.font = { color: { argb: "006100" }, name: "Calibri", size: 10 }; // Font #006100
    } else {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC7CE" }, // Fill #FFC7CE
      };
      row.font = { color: { argb: "9C0006" }, name: "Calibri", size: 10 }; // Font #9C0006
    }

    // Apply borders to all cells
    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  // Summary Row at bottom
  worksheet.addRow([]); // empty row separator
  const totalScanned = records.length;
  const attendancePct = totalScanned > 0 ? ((presentCount / totalScanned) * 100).toFixed(1) : "0.0";

  const summaryRow = worksheet.addRow([
    "SUMMARY",
    `Total: ${totalScanned} | Present: ${presentCount} | Absent: ${absentCount} | Rejected: ${rejectedCount}`,
    `Pct: ${attendancePct}%`,
    "",
    "",
    "",
    "",
  ]);

  summaryRow.font = { bold: true, size: 11, name: "Calibri" };
  summaryRow.height = 22;

  // Generate binary Buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
