"use client";
import { useState } from "react";
import { useLocale } from "@/lib/locales";
import { useToast } from "@/components/ui/Toast";
import {
  exportClassAttendanceToExcel,
  YearCode,
  DivisionCode,
} from "@/lib/excelExport";
import { getAllStudents } from "@/lib/excelExport";

const FY_DIVS: DivisionCode[] = ["A", "B", "C", "D", "E", "F"];
const SY_DIVS: DivisionCode[] = ["A", "B", "C", "D", "E", "F"];
const YEAR_CODES: YearCode[] = ["FY", "SY", "TY", "Final Year"];
const YEAR_NUMBERS: Record<YearCode, number> = { FY: 1, SY: 2, TY: 3, "Final Year": 4 };

interface ClassCard {
  year: YearCode;
  division: DivisionCode;
  studentCount: number;
}

export default function AdminAttendanceExportPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("All Courses Combined");

  const allStudents = getAllStudents();

  // Build grid of all FY-A..F and SY-A..F classes
  const classes: ClassCard[] = [];
  for (const year of YEAR_CODES) {
    const yearNum = YEAR_NUMBERS[year];
    const divs = ["A", "B", "C", "D", "E", "F"] as DivisionCode[];
    for (const div of divs) {
      const count = allStudents.filter(
        (s) => s.year === yearNum && s.division === div
      ).length;
      classes.push({ year, division: div, studentCount: count });
    }
  }

  const fyClasses = classes.filter((c) => c.year === "FY");
  const syClasses = classes.filter((c) => c.year === "SY");
  const tyClasses = classes.filter((c) => c.year === "TY");

  function handleExport(year: YearCode, division: DivisionCode) {
    const key = `${year}-${division}`;
    setExporting(key);
    try {
      exportClassAttendanceToExcel(year, division, selectedSubject);
      showToast(`📊 ZCOER_Attendance_${key}.xlsx downloaded!`, "success");
    } catch (err) {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setTimeout(() => setExporting(null), 600);
    }
  }

  function handleExportAll(year: YearCode) {
    const divs = ["A", "B", "C", "D", "E", "F"] as DivisionCode[];
    let delay = 0;
    for (const div of divs) {
      const key = `${year}-${div}`;
      setTimeout(() => {
        setExporting(key);
        exportClassAttendanceToExcel(year, div, selectedSubject);
        setTimeout(() => setExporting(null), 400);
      }, delay);
      delay += 500; // stagger downloads
    }
    showToast(`Exporting all ${year} classes (A–F)…`, "info");
  }

  const ClassGrid = ({
    title,
    yearCode,
    cards,
    accentColor,
  }: {
    title: string;
    yearCode: YearCode;
    cards: ClassCard[];
    accentColor: string;
  }) => (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-1.5 rounded-full"
            style={{ background: accentColor }}
          />
          <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">{title}</h2>
          <span className="text-xs font-mono text-[#33363D]/60 bg-[#FAF8F4] border border-[#33363D]/12 px-2 py-0.5 rounded-full">
            6 Divisions
          </span>
        </div>

        <button
          onClick={() => handleExportAll(yearCode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#4C7A5E] text-xs font-bold text-[#4C7A5E] hover:bg-[#4C7A5E] hover:text-white transition-all cursor-pointer"
        >
          📥 Export All {yearCode} (A–F)
        </button>
      </div>

      {/* Division Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {cards.map(({ year, division, studentCount }) => {
          const key = `${year}-${division}`;
          const isExporting = exporting === key;

          return (
            <div
              key={key}
              className="bg-white border border-[#33363D]/12 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-sm hover:border-[#33363D]/20 transition-all"
            >
              {/* Class badge */}
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto font-heading text-xl font-extrabold text-white shadow-sm"
                  style={{ background: accentColor }}
                >
                  {year[0]}{division}
                </div>
                <p className="font-heading font-bold text-[#1E2A4A] mt-2 text-sm">{key}</p>
                <p className="text-[11px] text-[#33363D]/60 font-mono">
                  {studentCount > 0 ? `${studentCount} Students` : "Empty Class"}
                </p>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleExport(year, division)}
                disabled={isExporting}
                className={[
                  "w-full py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                  isExporting
                    ? "bg-[#33363D]/10 text-[#33363D]/50"
                    : "bg-[#1E2A4A] hover:bg-[#2D3E61] text-white shadow-xs active:scale-95",
                ].join(" ")}
              >
                {isExporting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Download .xlsx</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-5 md:py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">
            📊 Attendance Excel Export
          </h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">
            Download official SPPU class attendance reports (.xlsx) — FY, SY, TY Divisions A to F
          </p>
        </div>
      </div>

      {/* Global Subject Filter */}
      <div className="bg-white border border-[#33363D]/12 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-[#1E2A4A]">
            Filter by Subject / Course
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[#33363D]/20 bg-white text-xs font-medium text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
          >
            <option value="All Courses Combined">All Courses Combined (Full Semester Ledger)</option>
            <option value="Database Management Systems (DBMS)">Database Management Systems (DBMS)</option>
            <option value="Computer Networks (CN)">Computer Networks (CN)</option>
            <option value="Operating Systems (OS)">Operating Systems (OS)</option>
            <option value="Software Engineering (SE)">Software Engineering (SE)</option>
            <option value="Theory of Computation (TOC)">Theory of Computation (TOC)</option>
            <option value="Engineering Mathematics-V">Engineering Mathematics-V (M-V)</option>
          </select>
        </div>

        <div className="shrink-0 bg-[#FAF8F4] border border-[#33363D]/12 rounded-xl px-3 py-2 text-xs font-mono text-[#33363D]/80 space-y-0.5">
          <p className="font-bold text-[#1E2A4A]">Excel Output Format</p>
          <p>ZCOER Official Letterhead</p>
          <p>SPPU Eligibility Status (75%)</p>
          <p>Guardian Contact Column</p>
        </div>
      </div>

      {/* FY Classes: A, B, C, D, E, F */}
      <ClassGrid
        title="First Year (FY) — All Divisions"
        yearCode="FY"
        cards={fyClasses}
        accentColor="#4C7A5E"
      />

      {/* SY Classes: A, B, C, D, E, F */}
      <ClassGrid
        title="Second Year (SY) — All Divisions"
        yearCode="SY"
        cards={syClasses}
        accentColor="#1E2A4A"
      />

      {/* TY Classes: A, B, C, D, E, F */}
      <ClassGrid
        title="Third Year (TY) — All Divisions"
        yearCode="TY"
        cards={tyClasses}
        accentColor="#E8A33D"
      />

      {/* Footer Notice */}
      <div className="rounded-2xl border border-[#E8A33D]/30 bg-[#FDF3E3] p-4 text-xs text-[#B47414] space-y-1">
        <p className="font-bold">📋 Report Disclaimer</p>
        <p className="leading-relaxed">
          These Excel reports are generated from live QR scan records stored in this session. They represent a
          <strong> frontend-only prototype</strong> of ZCOER&apos;s attendance system. For official university submissions,
          attendance must be verified and exported from the secured backend database by authorized faculty.
        </p>
      </div>
    </div>
  );
}
