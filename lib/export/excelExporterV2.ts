// lib/export/excelExporterV2.ts
// ─────────────────────────────────────────────────────────────────────
// Anti-Proxy v2 ExcelJS Generator matching Section 7 exact spec
// ─────────────────────────────────────────────────────────────────────
import ExcelJS from "exceljs";

export interface AttendanceV2ExportItem {
  rollNumber: string;
  fullName: string;
  status: "present" | "late" | "flagged" | "absent" | "excused" | "rejected";
  scannedAt?: string | null;
  isLate?: boolean;
  distanceM?: number | null;
  deviceMatch?: boolean | null;
  trustScore?: number | null;
  reasonCode?: string | null;
  overriddenBy?: string | null;
}

export async function generateExcelV2WorkbookBuffer(
  meta: { className: string; sessionDate: string; totalStudents: number },
  records: AttendanceV2ExportItem[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZCOER Attendance v2";
  workbook.created = new Date();

  const sanitizedSheetName = `${meta.className}_${meta.sessionDate}`.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31);
  const worksheet = workbook.addWorksheet(sanitizedSheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Columns: Roll No (12) | Name (28) | Status (12) | Scan time (20) | Late? (8) | Distance (m) (12) | Device match (14) | Trust score (12) | Reason (24) | Override by (18)
  worksheet.columns = [
    { header: "Roll No", key: "rollNumber", width: 12 },
    { header: "Name", key: "fullName", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "Scan time", key: "scannedAt", width: 20 },
    { header: "Late?", key: "isLate", width: 8 },
    { header: "Distance (m)", key: "distanceM", width: 12 },
    { header: "Device match", key: "deviceMatch", width: 14 },
    { header: "Trust score", key: "trustScore", width: 12 },
    { header: "Reason", key: "reasonCode", width: 24 },
    { header: "Override by", key: "overriddenBy", width: 18 },
  ];

  // Header row formatting: bold, fill #305496, white text
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" }, name: "Calibri", size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "305496" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "D9D9D9" } },
    left: { style: "thin", color: { argb: "D9D9D9" } },
    bottom: { style: "thin", color: { argb: "D9D9D9" } },
    right: { style: "thin", color: { argb: "D9D9D9" } },
  };

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let flaggedCount = 0;

  records.forEach((r) => {
    if (r.status === "present") presentCount++;
    else if (r.status === "late") lateCount++;
    else if (r.status === "absent") absentCount++;
    else if (r.status === "flagged") flaggedCount++;

    const row = worksheet.addRow({
      rollNumber: r.rollNumber,
      fullName: r.fullName,
      status: r.status.toUpperCase(),
      scannedAt: r.scannedAt || "—",
      isLate: r.status === "late" ? "YES" : "NO",
      distanceM: r.distanceM !== null && r.distanceM !== undefined ? r.distanceM : "—",
      deviceMatch: r.deviceMatch === true ? "MATCH" : r.deviceMatch === false ? "MISMATCH" : "—",
      trustScore: r.trustScore !== null && r.trustScore !== undefined ? `${r.trustScore}/100` : "—",
      reasonCode: r.reasonCode || "—",
      overriddenBy: r.overriddenBy || "—",
    });

    row.height = 20;

    // Apply status-specific fill colors from v2 Section 7 spec
    let fillColor = "C6EFCE"; // default present green
    let fontColor = "006100";

    if (r.status === "absent" || r.status === "rejected") {
      fillColor = "FFC7CE"; // red bad
      fontColor = "9C0006";
    } else if (r.status === "late") {
      fillColor = "FFEB9C"; // yellow late
      fontColor = "9C6500";
    } else if (r.status === "flagged") {
      fillColor = "FCE4D6"; // soft orange
      fontColor = "C65911";
    } else if (r.status === "excused") {
      fillColor = "DDEBF7"; // soft blue
      fontColor = "1F4E78";
    }

    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fillColor },
    };
    row.font = { color: { argb: fontColor }, name: "Calibri", size: 10 };

    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  worksheet.addRow([]);
  const summaryRow = worksheet.addRow([
    "SUMMARY",
    `Total: ${records.length} | Present: ${presentCount} | Late: ${lateCount} | Flagged: ${flaggedCount} | Absent: ${absentCount}`,
    `Pct: ${records.length > 0 ? (((presentCount + lateCount) / records.length) * 100).toFixed(1) : "0.0"}%`,
  ]);
  summaryRow.font = { bold: true, name: "Calibri", size: 11 };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
