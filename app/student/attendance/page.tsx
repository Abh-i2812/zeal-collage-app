"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";
import { subjects, getAttendanceSummary, getSubject } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListSkeleton } from "@/components/ui/Skeleton";

interface SubjectCalendarProps {
  subjectId: string;
  onClose: () => void;
}

function SubjectCalendar({ subjectId, onClose }: SubjectCalendarProps) {
  const { t } = useLocale();
  const session = getSession();
  if (!session) return null;

  const summary = getAttendanceSummary(session.id);
  const data = summary[subjectId];
  const subject = getSubject(subjectId);
  const [selectedRecord, setSelectedRecord] = useState<{ date: string; status: string; method: string; time?: string } | null>(null);

  if (!data) return null;

  const dateMap = new Map(data.records.map((r) => [r.date, r]));
  const pct = ((data.present / data.total) * 100).toFixed(1);
  const sortedDates = [...dateMap.keys()].sort();

  return (
    <div className="fixed inset-0 z-50 bg-[#1E2A4A]/50 backdrop-blur-xs flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-[slideUp_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-[#E8A33D] uppercase tracking-wider">{subject?.shortName}</span>
            <h3 className="font-heading text-lg font-bold text-[#1E2A4A] leading-tight">{subject?.name}</h3>
            <p className="font-mono text-sm font-bold mt-1" style={{ color: Number(pct) >= 75 ? "#4C7A5E" : "#B4483A" }}>
              {data.present}/{data.total} lectures · {pct}% Attendance
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF8F4] text-[#33363D]/60 hover:bg-[#33363D]/10" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Lecture dots */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#33363D]/60 mb-2">
            <span>Lecture History</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4C7A5E]" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#B4483A]" /> Absent</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-[#FAF8F4] rounded-2xl border border-[#33363D]/10">
            {sortedDates.map((date) => {
              const rec = dateMap.get(date)!;
              const color = rec.status === "present" ? "#4C7A5E" : "#B4483A";
              return (
                <button
                  key={date}
                  onClick={() => setSelectedRecord({ date, status: rec.status, method: rec.method, time: rec.time })}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={date}
                  aria-label={`${date}: ${rec.status}`}
                >
                  {new Date(date).getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected record detail */}
        {selectedRecord ? (
          <div className="rounded-2xl border border-[#33363D]/12 p-3.5 space-y-1 bg-white shadow-xs">
            <p className="text-xs text-[#33363D]/60 font-semibold">
              {new Date(selectedRecord.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: selectedRecord.status === "present" ? "#4C7A5E" : "#B4483A" }}
              />
              <p className="text-sm font-bold capitalize" style={{ color: selectedRecord.status === "present" ? "#4C7A5E" : "#B4483A" }}>
                {selectedRecord.status}
              </p>
              {selectedRecord.time && (
                <p className="font-mono text-xs text-[#33363D]/60 ml-auto">{selectedRecord.time}</p>
              )}
            </div>
            <p className="text-xs text-[#33363D]/70 capitalize">
              Verified by: {selectedRecord.method.replace("-", " ")}
            </p>
          </div>
        ) : (
          <p className="text-xs text-center text-[#33363D]/50 italic">Tap any date above to view scan timestamp &amp; verification method</p>
        )}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <ListSkeleton />;

  const session = getSession();
  if (!session) return null;

  const summary = getAttendanceSummary(session.id);

  // Overall calculations
  const subjectEntries = Object.entries(summary).sort((a, b) => {
    const pctA = a[1].present / a[1].total;
    const pctB = b[1].present / b[1].total;
    if (pctA < 0.75 && pctB >= 0.75) return -1;
    if (pctA >= 0.75 && pctB < 0.75) return 1;
    return pctA - pctB;
  });

  const totalPresent = subjectEntries.reduce((acc, [, d]) => acc + d.present, 0);
  const totalLectures = subjectEntries.reduce((acc, [, d]) => acc + d.total, 0);
  const overallPct = totalLectures > 0 ? ((totalPresent / totalLectures) * 100).toFixed(1) : "0";
  const isOverallGood = Number(overallPct) >= 75;

  return (
    <div className="px-4 py-5 md:py-6 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">{t("attendance_title")}</h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">SPPU Minimum 75% Examination Eligibility Requirement</p>
        </div>
      </div>

      {/* ── Executive Attendance Health Card ────────────────────────── */}
      <div className="rounded-3xl bg-[#1E2A4A] text-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#E8A33D] uppercase tracking-wider">Overall Semester Attendance</span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-4xl font-extrabold text-white">{overallPct}%</span>
              <span className="text-xs text-white/70 font-mono">({totalPresent} of {totalLectures} conducted)</span>
            </div>
          </div>

          <span
            className="text-xs font-bold px-3 py-1 rounded-full border"
            style={{
              backgroundColor: isOverallGood ? "rgba(76, 122, 94, 0.2)" : "rgba(180, 72, 58, 0.2)",
              borderColor: isOverallGood ? "rgba(76, 122, 94, 0.4)" : "rgba(180, 72, 58, 0.4)",
              color: isOverallGood ? "#4C7A5E" : "#F87171",
            }}
          >
            {isOverallGood ? "✓ University Eligible" : "⚠️ Below 75% Defaulter"}
          </span>
        </div>

        {/* Global Progress Bar with 75% threshold guide */}
        <div className="space-y-1.5 pt-1">
          <div className="relative h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(Number(overallPct), 100)}%`,
                backgroundColor: isOverallGood ? "#4C7A5E" : "#B4483A",
              }}
            />
            {/* 75% guide pin */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10" style={{ left: "75%" }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>0%</span>
            <span className="text-[#E8A33D] font-bold">75% SPPU Cutoff</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Per-Subject Cards ───────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">Course Breakdown</h2>

        {subjectEntries.map(([subjectId, data]) => {
          const subject = getSubject(subjectId);
          const pct = (data.present / data.total) * 100;
          const pctStr = pct.toFixed(1);
          const isBelow = pct < 75;
          const color = isBelow ? "#B4483A" : "#4C7A5E";

          const needed = Math.max(0, Math.ceil(0.75 * (data.total + 10) - data.present));
          const forecastN = Math.min(needed, 10);

          return (
            <Card
              key={subjectId}
              onClick={() => setSelectedSubject(subjectId)}
              className={[
                "space-y-3 cursor-pointer transition-all",
                isBelow ? "border-l-4 border-l-[#B4483A] bg-[#B4483A]/2" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#1E2A4A] truncate">{subject?.name}</p>
                    <span className="text-xs text-[#33363D]/60 font-semibold font-mono">({subject?.shortName})</span>
                  </div>
                  <p className="text-xs text-[#33363D]/60 mt-0.5">{subject?.credits} Credits · 4 hrs/week</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isBelow && <StatusBadge status="left" label={t("below_eligibility")} />}
                  <span className="font-mono text-base font-bold" style={{ color }}>
                    {pctStr}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 bg-[#33363D]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#33363D]/60">
                    {data.present} of {data.total} {t("lectures")}
                  </span>
                  {isBelow ? (
                    <span className="text-[11px] font-bold text-[#B4483A]">
                      Need {forecastN} of next 10 lectures
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#4C7A5E] font-medium">Good Standing ✓</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedSubject && (
        <SubjectCalendar
          subjectId={selectedSubject}
          onClose={() => setSelectedSubject(null)}
        />
      )}
    </div>
  );
}
