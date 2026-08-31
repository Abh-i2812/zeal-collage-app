"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { marks, subjects, getSubject, getGrade } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function MarksPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <ListSkeleton />;

  const session = getSession();
  if (!session) return null;

  const studentMarks = marks.filter((m) => m.studentId === session.id);

  return (
    <div className="px-4 py-5 md:py-6 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">{t("marks_title")} &amp; Performance</h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">Savitribai Phule Pune University Grade Ledger</p>
        </div>
        <span className="text-xs font-bold text-[#1E2A4A] bg-white border border-[#33363D]/15 px-3 py-1 rounded-full shadow-2xs">
          Semester V (2026)
        </span>
      </div>

      {/* ── Executive Transcript Scorecard ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-[#1E2A4A] text-white rounded-2xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] text-[#E8A33D] font-bold uppercase tracking-wider">Semester SPI</p>
          <p className="font-mono text-3xl font-extrabold text-white">8.42</p>
          <p className="text-[10px] text-white/60">Out of 10.00 Scale</p>
        </div>

        <div className="bg-white border border-[#33363D]/12 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-bold uppercase tracking-wider">Cumulative CPI</p>
          <p className="font-mono text-3xl font-extrabold text-[#1E2A4A]">8.10</p>
          <p className="text-[10px] text-[#4C7A5E] font-semibold">First Class with Dist. ✓</p>
        </div>

        <div className="bg-white border border-[#33363D]/12 rounded-2xl p-4 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-bold uppercase tracking-wider">Total Credits</p>
          <p className="font-mono text-3xl font-extrabold text-[#1E2A4A]">21</p>
          <p className="text-[10px] text-[#33363D]/60">All 6 Courses Enrolled</p>
        </div>

        <Link href="/student/rankings">
          <div className="bg-gradient-to-br from-[#FAF8F4] to-[#FDF3E3] border border-[#E8A33D]/30 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-[#E8A33D] transition-colors cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#B47414] font-bold uppercase tracking-wider">Class Rank</p>
              <span className="text-sm">🏆</span>
            </div>
            <p className="font-heading text-3xl font-extrabold text-[#1E2A4A]">#4</p>
            <p className="text-[10px] text-[#E8A33D] font-bold underline">View Leaderboard ➔</p>
          </div>
        </Link>
      </div>

      {/* ── Per-Subject Grade Cards ─────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">Internal (CIE) &amp; University (ESE) Scores</h2>

        {studentMarks.map((m) => {
          const sub = getSubject(m.subjectId);
          const cieAvg = Math.round((m.cie1 + m.cie2 + m.cie3) / 3);
          const total = m.ese !== null ? cieAvg + m.ese : null;
          const grade = total !== null ? getGrade(total) : null;
          const pass = total !== null && total >= 40;

          return (
            <Card key={m.subjectId} className="space-y-3">
              {/* Subject header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1E2A4A]">{sub?.name}</h3>
                    <span className="font-mono text-xs text-[#33363D]/60 font-semibold">({sub?.shortName})</span>
                  </div>
                  <p className="text-xs text-[#33363D]/60 mt-0.5">{sub?.credits} Credits · Core Course</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {grade && (
                    <span className={[
                      "font-mono text-base font-bold px-2 py-0.5 rounded-lg border",
                      grade === "F"
                        ? "bg-[#B4483A]/10 text-[#B4483A] border-[#B4483A]/20"
                        : "bg-[#4C7A5E]/10 text-[#4C7A5E] border-[#4C7A5E]/20",
                    ].join(" ")}>
                      Grade {grade}
                    </span>
                  )}
                  {total !== null ? (
                    <StatusBadge status={pass ? "active" : "blocked"} label={pass ? "Pass ✓" : "Fail"} />
                  ) : (
                    <StatusBadge status="pending" label={t("not_declared")} />
                  )}
                </div>
              </div>

              {/* Internal Assessments Matrix */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { label: "CIE 1 (Unit 1-2)", value: m.cie1, max: 30 },
                  { label: "CIE 2 (Unit 3-4)", value: m.cie2, max: 30 },
                  { label: "CIE 3 (Unit 5-6)", value: m.cie3, max: 30 },
                  { label: "CIE Average", value: cieAvg, max: 30, highlight: true },
                ].map(({ label, value, max, highlight }) => (
                  <div
                    key={label}
                    className={[
                      "rounded-xl py-2 px-1 border",
                      highlight
                        ? "bg-[#E8A33D]/10 border-[#E8A33D]/30"
                        : "bg-[#FAF8F4] border-[#33363D]/10",
                    ].join(" ")}
                  >
                    <p className="font-mono text-sm font-bold text-[#1E2A4A]">{value}</p>
                    <p className="text-[10px] text-[#33363D]/50 font-mono">/{max}</p>
                    <p className="text-[10px] text-[#33363D]/70 mt-0.5 truncate font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* End Sem & Total */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#33363D]/8">
                <div className="flex-1 text-center bg-[#FAF8F4] rounded-xl py-2 border border-[#33363D]/10">
                  <p className="font-mono text-sm font-bold text-[#1E2A4A]">
                    {m.ese !== null ? m.ese : "Pending"}
                  </p>
                  <p className="text-[10px] text-[#33363D]/50 font-mono">/70 (ESE)</p>
                  <p className="text-[10px] text-[#33363D]/60 font-medium">University Exam</p>
                </div>
                <div className="flex-1 text-center bg-[#1E2A4A] text-white rounded-xl py-2 shadow-xs">
                  <p className="font-mono text-sm font-extrabold text-[#E8A33D]">
                    {total !== null ? total : "—"}
                  </p>
                  <p className="text-[10px] text-white/50 font-mono">/100 Total</p>
                  <p className="text-[10px] text-white/80 font-medium">{t("total")}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
