"use client";
import { useState } from "react";
import {
  exportClassAttendanceToExcel,
  YearCode,
  DivisionCode,
  getClassCode,
} from "@/lib/excelExport";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ExcelExportModalProps {
  open: boolean;
  onClose: () => void;
  defaultYear?: YearCode;
  defaultDivision?: DivisionCode;
}

const YEARS: YearCode[] = ["FY", "SY", "TY", "Final Year"];
const DIVISIONS: DivisionCode[] = ["A", "B", "C", "D", "E", "F"];

export function ExcelExportModal({
  open,
  onClose,
  defaultYear = "FY",
  defaultDivision = "A",
}: ExcelExportModalProps) {
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState<YearCode>(defaultYear);
  const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(defaultDivision);
  const [subjectName, setSubjectName] = useState("All Courses Combined");
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const classCode = `${selectedYear}-${selectedDivision}`;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      exportClassAttendanceToExcel(selectedYear, selectedDivision, subjectName);
      showToast(`Excel file downloaded: ZCOER_Attendance_${classCode}.xlsx 📊`, "success");
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast("Failed to generate Excel file", "error");
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1E2A4A]/50 backdrop-blur-xs flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4C7A5E]/15 text-[#4C7A5E] flex items-center justify-center text-xl font-bold">
              📊
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1E2A4A]">
                Export Attendance to Excel
              </h3>
              <p className="text-xs text-[#33363D]/60 mt-0.5">
                Generate official SPPU class report (.xlsx)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF8F4] text-[#33363D]/60 hover:bg-[#33363D]/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          {/* Year Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E2A4A]">1. Select Year / Class</label>
            <div className="grid grid-cols-4 gap-1.5">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYear(y)}
                  className={[
                    "py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    selectedYear === y
                      ? "bg-[#1E2A4A] text-white border-[#1E2A4A] shadow-xs"
                      : "bg-[#FAF8F4] text-[#33363D] border-[#33363D]/15 hover:border-[#33363D]/30",
                  ].join(" ")}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Division Selection (A, B, C, D, E, F) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E2A4A]">
              2. Select Division ({selectedYear}-A to {selectedYear}-F)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  type="button"
                  onClick={() => setSelectedDivision(div)}
                  className={[
                    "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    selectedDivision === div
                      ? "bg-[#E8A33D] text-[#1E2A4A] border-[#E8A33D] shadow-xs font-mono"
                      : "bg-[#FAF8F4] text-[#33363D] border-[#33363D]/15 hover:border-[#33363D]/30 font-mono",
                  ].join(" ")}
                >
                  Div {div}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E2A4A]">3. Subject / Course</label>
            <select
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-xs font-medium text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
            >
              <option value="All Courses Combined">All Courses Combined (Semester Ledger)</option>
              <option value="Database Management Systems (DBMS)">Database Management Systems (DBMS)</option>
              <option value="Computer Networks (CN)">Computer Networks (CN)</option>
              <option value="Operating Systems (OS)">Operating Systems (OS)</option>
              <option value="Software Engineering (SE)">Software Engineering (SE)</option>
              <option value="Theory of Computation (TOC)">Theory of Computation (TOC)</option>
            </select>
          </div>

          {/* File Preview Badge */}
          <div className="p-3 bg-[#FAF8F4] rounded-2xl border border-[#33363D]/10 flex items-center justify-between text-xs">
            <span className="text-[#33363D]/70 font-medium">Selected Output:</span>
            <span className="font-mono font-bold text-[#4C7A5E] bg-[#4C7A5E]/10 px-2 py-0.5 rounded">
              ZCOER_Attendance_{classCode}.xlsx
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={isExporting}
            onClick={handleDownload}
          >
            📥 Download Excel Spreadsheet (.xlsx)
          </Button>
        </div>
      </div>
    </div>
  );
}
