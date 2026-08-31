"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { useLocale } from "@/lib/locales";
import {
  students,
  notices,
  getAttendanceSummary,
  getTodaySlots,
  getDayOfWeek,
  getSubject,
  getTeacher,
  getStudentRanking,
} from "@/lib/mockDb";
import { Card } from "@/components/ui/Card";
import { HomePageSkeleton } from "@/components/ui/Skeleton";

export default function StudentHome() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <HomePageSkeleton />;

  const session = getSession();
  if (!session) return null;

  const student = students.find((s) => s.id === session.id);
  if (!student) return null;

  const studentRank = getStudentRanking(session.id);

  // Attendance summary
  const attSummary = getAttendanceSummary(session.id);
  const subjectIds = Object.keys(attSummary);
  const totalPresent = subjectIds.reduce((acc, sid) => acc + attSummary[sid].present, 0);
  const totalClasses = subjectIds.reduce((acc, sid) => acc + attSummary[sid].total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100 * 10) / 10 : 0;
  const isGoodAtt = overallPct >= 75;

  // Forecast: how many of next 12 needed to reach 75%
  const needed75 = Math.max(0, Math.ceil(0.75 * (totalClasses + 12) - totalPresent));
  const forecastN = Math.min(needed75, 12);

  // Next lecture calculation
  const today = getDayOfWeek();
  const todaySlots = getTodaySlots(today);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  const currentOrNextSlot = todaySlots.find((s) => {
    const [eh, em] = s.endTime.split(":").map(Number);
    return eh * 60 + em > nowMinutes;
  }) ?? todaySlots[0];

  const nextSubject = currentOrNextSlot ? getSubject(currentOrNextSlot.subjectId) : null;
  const nextTeacher = currentOrNextSlot ? getTeacher(currentOrNextSlot.teacherId) : null;

  const recentNotices = notices.slice(0, 3);

  return (
    <div className="px-4 py-5 md:py-6 space-y-6">
      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1E2A4A] tracking-tight">
              {t("greeting")}, {student.name.split(" ")[0]}
            </h1>
            <span className="text-xl animate-pulse">👋</span>
          </div>
          <p className="text-xs text-[#33363D]/70 mt-0.5">
            Year {student.year} · Sem {student.semester} ({student.department}) · Div {student.division} · <span className="font-mono text-[#1E2A4A] font-semibold">{student.id}</span>
          </p>
        </div>

        <span className="text-xs font-semibold text-[#1E2A4A] bg-white border border-[#33363D]/15 px-3 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
          📅 {now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* ── Quick Action Dock ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <Link
          href="/student/checkin"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#E8A33D] to-[#D97706] text-[#1E2A4A] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <span className="text-xs font-bold leading-tight">Check In</span>
          <span className="text-[10px] opacity-80 leading-none mt-0.5">QR Scan</span>
        </Link>

        <Link
          href="/student/idcard"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#33363D]/12 hover:border-[#1E2A4A]/30 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#1E2A4A]/5 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform">
            🪪
          </div>
          <span className="text-xs font-bold text-[#1E2A4A] leading-tight">ID Card</span>
          <span className="text-[10px] text-[#33363D]/60 leading-none mt-0.5">Digital Card</span>
        </Link>

        <Link
          href="/student/rankings"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#33363D]/12 hover:border-[#E8A33D] hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform">
            🏆
          </div>
          <span className="text-xs font-bold text-[#1E2A4A] leading-tight">Rank #{studentRank?.rankClass ?? 4}</span>
          <span className="text-[10px] text-[#E8A33D] font-bold font-mono leading-none mt-0.5">{studentRank?.totalScore ?? 865} pts</span>
        </Link>

        <Link
          href="/student/marks"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-[#33363D]/12 hover:border-[#4C7A5E]/40 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all text-center group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#4C7A5E]/10 flex items-center justify-center text-lg mb-1 group-hover:scale-110 transition-transform">
            📊
          </div>
          <span className="text-xs font-bold text-[#1E2A4A] leading-tight">SPI 8.42</span>
          <span className="text-[10px] text-[#4C7A5E] font-bold leading-none mt-0.5">Sem 5</span>
        </Link>
      </div>

      {/* ── Next Class Live Status Banner ───────────────────────────── */}
      {nextSubject && currentOrNextSlot && (
        <div className="relative overflow-hidden rounded-2xl bg-[#1E2A4A] text-white p-4 md:p-5 shadow-sm border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8A33D] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#E8A33D]">
                  {t("next_lecture")} · {currentOrNextSlot.startTime} – {currentOrNextSlot.endTime}
                </span>
              </div>
              <h2 className="font-heading text-lg md:text-xl font-bold text-white leading-tight">
                {nextSubject.name} ({nextSubject.shortName})
              </h2>
              <p className="text-xs text-white/70">
                {currentOrNextSlot.room} · {nextTeacher?.name ?? "Faculty"} · {currentOrNextSlot.batch ? `Batch ${currentOrNextSlot.batch}` : "Div A"}
              </p>
            </div>

            <Link
              href="/student/checkin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8A33D] text-[#1E2A4A] font-bold text-xs md:text-sm hover:bg-[#d4922c] transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <span>Scan Check-In</span>
              <span>➔</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── 2×2 Metric Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Attendance Card */}
        <Link href="/student/attendance">
          <Card className="h-full space-y-2 group cursor-pointer hover:border-[#1E2A4A]/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#33363D]/70">{t("nav_attendance")}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isGoodAtt ? "#EBF4EF" : "#FBECEB",
                  color: isGoodAtt ? "#4C7A5E" : "#B4483A",
                }}
              >
                {isGoodAtt ? "Eligible ✓" : "Defaulter ⚠️"}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span
                className="text-3xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: isGoodAtt ? "#4C7A5E" : "#B4483A" }}
              >
                {overallPct}%
              </span>
              <span className="text-xs text-[#33363D]/50 font-mono">({totalPresent}/{totalClasses})</span>
            </div>

            {/* Progress line */}
            <div className="h-1.5 w-full bg-[#33363D]/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(overallPct, 100)}%`,
                  backgroundColor: isGoodAtt ? "#4C7A5E" : "#B4483A",
                }}
              />
            </div>

            <p className="text-[11px] text-[#33363D]/60 leading-tight">
              {isGoodAtt
                ? t("attend_forecast", { n: forecastN, total: 12 })
                : `⚠️ Attend next ${forecastN} lectures to restore eligibility`}
            </p>
          </Card>
        </Link>

        {/* Zeal Rank & Gamification Card */}
        <Link href="/student/rankings">
          <Card className="h-full space-y-2 group cursor-pointer hover:border-[#E8A33D]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#33363D]/70">Leaderboard</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8A33D]/15 text-[#1E2A4A]">
                Top 10%
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl md:text-4xl font-extrabold text-[#1E2A4A] tracking-tight">
                #{studentRank?.rankClass ?? 4}
              </span>
              <span className="text-xs text-[#33363D]/60 font-semibold">in Class</span>
            </div>

            <div className="h-1.5 w-full bg-[#33363D]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8A33D] rounded-full"
                style={{ width: `${((studentRank?.totalScore ?? 865) / 1000) * 100}%` }}
              />
            </div>

            <p className="text-[11px] text-[#E8A33D] font-semibold leading-tight flex items-center justify-between">
              <span>{studentRank?.totalScore ?? 865} / 1000 pts</span>
              <span className="underline">Claim #1 ➔</span>
            </p>
          </Card>
        </Link>

        {/* Fees Status Card */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#33363D]/70">{t("fees")}</span>
            <span className="text-[11px] text-[#33363D]/50 font-mono">2026–27</span>
          </div>

          {student.feesDue > 0 ? (
            <div className="space-y-1">
              <p className="font-mono text-2xl font-bold text-[#B4483A]">
                ₹{student.feesDue.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-[#B4483A] font-medium">
                {t("fees_due")} {student.feeDueDate ? new Date(student.feeDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Soon"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xl md:text-2xl font-bold text-[#4C7A5E] flex items-center gap-1.5">
                <span>{t("fees_clear")}</span>
                <span>✓</span>
              </p>
              <p className="text-xs text-[#33363D]/60">Receipt #ZEC2026 ready</p>
            </div>
          )}
        </Card>

        {/* Documents Card */}
        <Link href="/student/documents">
          <Card className="h-full space-y-2 group cursor-pointer hover:border-[#1E2A4A]/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#33363D]/70">{t("documents")}</span>
              <span className="text-xs">📂</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-extrabold text-[#1E2A4A]">
                {student.documentsReady}
              </span>
              <span className="text-xs text-[#4C7A5E] font-semibold">{t("docs_ready")}</span>
            </div>

            <p className="text-[11px] text-[#33363D]/60 leading-tight">
              Bonafide &amp; Fee Receipts verified
            </p>
          </Card>
        </Link>
      </div>

      {/* ── Today's Timetable Schedule ─────────────────────────────── */}
      <section aria-labelledby="timetable-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="timetable-heading" className="font-heading text-lg font-bold text-[#1E2A4A]">
              {t("todays_timetable")}
            </h2>
            <p className="text-xs text-[#33363D]/60">Semester V · Section A Schedule</p>
          </div>
          <span className="text-xs font-semibold text-[#1E2A4A] bg-white border border-[#33363D]/15 px-2.5 py-1 rounded-lg">
            {today}
          </span>
        </div>

        {todaySlots.length === 0 ? (
          <div className="text-sm text-[#33363D]/60 py-8 text-center bg-white rounded-2xl border border-dashed border-[#33363D]/20">
            No lectures scheduled for today. Enjoy your day! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {todaySlots.map((slot) => {
              const sub = getSubject(slot.subjectId);
              const teacher = getTeacher(slot.teacherId);
              const [sh, sm] = slot.startTime.split(":").map(Number);
              const [eh, em] = slot.endTime.split(":").map(Number);
              const slotStart = sh * 60 + sm;
              const slotEnd = eh * 60 + em;
              const isCurrent = nowMinutes >= slotStart && nowMinutes < slotEnd;
              const isPast = nowMinutes >= slotEnd;

              return (
                <div
                  key={`${slot.day}-${slot.period}`}
                  className={[
                    "flex items-center gap-3 bg-white rounded-xl border p-3.5 transition-all",
                    isCurrent
                      ? "border-l-4 border-l-[#E8A33D] border-[#E8A33D]/40 bg-[#E8A33D]/5 shadow-xs"
                      : isPast
                      ? "opacity-60 border-[#33363D]/10"
                      : "border-[#33363D]/12 hover:border-[#1E2A4A]/25",
                  ].join(" ")}
                >
                  {/* Period Time in Mono */}
                  <div className="shrink-0 text-right w-16">
                    <p className="font-mono text-xs font-bold text-[#1E2A4A]">{slot.startTime}</p>
                    <p className="font-mono text-[10px] text-[#33363D]/50">{slot.endTime}</p>
                  </div>

                  {/* Subject Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1E2A4A] truncate">{sub?.shortName ?? "Lecture"}</p>
                      {isCurrent && (
                        <span className="text-[9px] font-bold bg-[#E8A33D] text-[#1E2A4A] px-1.5 py-0.2 rounded uppercase tracking-wider">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#33363D]/70 truncate">{sub?.name} · {teacher?.name}</p>
                  </div>

                  {/* Room & Batch */}
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-semibold text-[#1E2A4A] bg-[#FAF8F4] border border-[#33363D]/10 px-2 py-0.5 rounded-md">
                      {slot.room}
                    </span>
                    {slot.batch && <p className="text-[10px] text-[#33363D]/50 mt-0.5">Batch {slot.batch}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── College Circulars & Notices ─────────────────────────────── */}
      <section aria-labelledby="notices-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="notices-heading" className="font-heading text-lg font-bold text-[#1E2A4A]">
              {t("recent_notices")}
            </h2>
            <p className="text-xs text-[#33363D]/60">Official notifications from SPPU &amp; Examination Cell</p>
          </div>
          <Link href="/student/notices" className="text-xs font-semibold text-[#1E2A4A] hover:text-[#E8A33D] transition-colors">
            {t("view_all")} ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentNotices.map((notice) => (
            <Link key={notice.id} href={`/student/notices?id=${notice.id}`}>
              <Card className="h-full flex flex-col justify-between space-y-2 hover:border-[#1E2A4A]/25 cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8A33D]">
                      {notice.category}
                    </span>
                    <span className="text-[10px] text-[#33363D]/50">
                      {new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E2A4A] line-clamp-2 leading-snug">
                    {notice.title}
                  </h3>
                </div>
                <p className="text-[11px] text-[#33363D]/60 pt-1 border-t border-[#33363D]/8">
                  {notice.postedBy}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
