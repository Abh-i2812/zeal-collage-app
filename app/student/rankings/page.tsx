"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  studentRankings,
  getStudentRanking,
  getLeaderboard,
  type StudentRanking,
} from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { ListSkeleton } from "@/components/ui/Skeleton";

type Scope = "class" | "dept" | "college";

export default function StudentRankingsPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<Scope>("class");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <ListSkeleton />;

  const session = getSession();
  if (!session) return null;

  const currentStudentRanking = getStudentRanking(session.id);
  const leaderboard = getLeaderboard(scope);
  const topper = leaderboard[0];

  const gapToRank1 =
    currentStudentRanking && topper && currentStudentRanking.studentId !== topper.studentId
      ? topper.totalScore - currentStudentRanking.totalScore
      : 0;

  function toggleMission(title: string, pts: number) {
    setCompletedMissions((prev) => {
      const next = !prev[title];
      if (next) {
        showToast(`Mission completed! +${pts} simulated points applied! 🎯`, "success");
      }
      return { ...prev, [title]: next };
    });
  }

  // Simulated bonus from checked missions
  const simulatedBonus = currentStudentRanking
    ? currentStudentRanking.actionPlan.reduce(
        (acc, m) => (completedMissions[m.title] ? acc + m.pts : acc),
        0
      )
    : 0;

  const dynamicScore = (currentStudentRanking?.totalScore ?? 865) + simulatedBonus;
  const dynamicRank =
    dynamicScore >= 940 ? 1 : dynamicScore >= 915 ? 2 : dynamicScore >= 890 ? 3 : 4;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">
            {t("rankings_title")}
          </h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">
            Academic test scores, attendance streaks &amp; technical activities
          </p>
        </div>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="text-xs font-semibold text-[#1E2A4A] bg-white border border-[#33363D]/15 px-3 py-1.5 rounded-lg hover:border-[#1E2A4A] transition-colors shrink-0"
        >
          ℹ️ {t("how_scoring_works")}
        </button>
      </div>

      {/* ── Spotlight / Current Student Rank Hero Card ─────────────── */}
      {currentStudentRanking && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E2A4A] to-[#263559] text-white p-5 shadow-sm space-y-4">
          {/* Top banner info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-[#E8A33D] font-semibold uppercase tracking-wider">
                  {t("your_rank")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-3xl font-bold text-white">
                    #{dynamicRank}
                  </span>
                  <span className="text-xs text-white/70">
                    in {currentStudentRanking.division ? `Div ${currentStudentRanking.division}` : "Class"}
                  </span>
                  {currentStudentRanking.rankChange > 0 && (
                    <span className="text-xs font-bold text-[#4C7A5E] bg-white/10 px-1.5 py-0.5 rounded">
                      ▲ +{currentStudentRanking.rankChange} this week
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-white/60">{t("zeal_score")}</p>
              <p className="font-mono text-2xl font-bold text-[#E8A33D]">
                {dynamicScore} <span className="text-xs font-normal text-white/60">/ 1000</span>
              </p>
            </div>
          </div>

          {/* Points Breakdown Bars */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Score Composition</span>
              <span className="font-mono text-[11px]">
                {currentStudentRanking.academicScore} (Marks) + {currentStudentRanking.attendanceScore} (Att) + {currentStudentRanking.activityScore} (Act)
              </span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${(currentStudentRanking.academicScore / 1000) * 100}%` }}
                className="bg-[#E8A33D] h-full"
                title="Academic Score"
              />
              <div
                style={{ width: `${(currentStudentRanking.attendanceScore / 1000) * 100}%` }}
                className="bg-[#4C7A5E] h-full"
                title="Attendance Score"
              />
              <div
                style={{ width: `${(currentStudentRanking.activityScore / 1000) * 100}%` }}
                className="bg-[#60A5FA] h-full"
                title="Activities Score"
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/60 font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E8A33D]" /> Academics (50%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4C7A5E]" /> Attendance (30%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#60A5FA]" /> Activities (20%)</span>
            </div>
          </div>

          {/* Motivational Gap to Rank #1 */}
          {topper && currentStudentRanking.studentId !== topper.studentId && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-start gap-2.5">
              <span className="text-xl shrink-0 mt-0.5">🎯</span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">
                  {gapToRank1 - simulatedBonus > 0
                    ? `Only ${gapToRank1 - simulatedBonus} points needed to surpass Rank #1 (${topper.name})!`
                    : `🎉 You have reached the points threshold for Rank #1!`}
                </p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Complete the target study &amp; attendance missions below to secure the #1 Gold Scholar Crown.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action Plan: Missions to Climb Rank ──────────────────────── */}
      {currentStudentRanking && currentStudentRanking.actionPlan.length > 0 && (
        <section aria-labelledby="missions-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="missions-heading" className="font-heading text-lg font-semibold text-[#1E2A4A]">
              🎯 {t("action_plan_to_win")}
            </h2>
            <span className="text-xs text-[#33363D]/60">Tap to simulate progress</span>
          </div>

          <div className="space-y-2">
            {currentStudentRanking.actionPlan.map((mission) => {
              const done = !!completedMissions[mission.title];
              return (
                <div
                  key={mission.title}
                  onClick={() => toggleMission(mission.title, mission.pts)}
                  className={[
                    "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                    done
                      ? "bg-[#4C7A5E]/10 border-[#4C7A5E]/30 text-[#1E2A4A]"
                      : "bg-white border-[#33363D]/15 hover:border-[#33363D]/30",
                  ].join(" ")}
                  role="checkbox"
                  aria-checked={done}
                  tabIndex={0}
                >
                  <div
                    className={[
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      done
                        ? "bg-[#4C7A5E] border-[#4C7A5E] text-white"
                        : "border-[#33363D]/30 bg-white",
                    ].join(" ")}
                  >
                    {done && <span className="text-xs font-bold">✓</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={[
                          "text-sm font-semibold",
                          done ? "line-through text-[#33363D]/50" : "text-[#1E2A4A]",
                        ].join(" ")}
                      >
                        {mission.title}
                      </p>
                      <span className="font-mono text-xs font-bold text-[#E8A33D] shrink-0 bg-[#E8A33D]/10 px-2 py-0.5 rounded">
                        +{mission.pts} {t("points")}
                      </span>
                    </div>
                    <p className="text-xs text-[#33363D]/60 mt-0.5 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Top 3 Podium ────────────────────────────────────────────── */}
      <section aria-labelledby="podium-heading" className="space-y-3 pt-2">
        <h2 id="podium-heading" className="font-heading text-lg font-semibold text-[#1E2A4A]">
          🏆 Top 3 Honor Roll
        </h2>

        <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-full bg-[#1E2A4A] border-2 border-[#94A3B8] flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-semibold font-mono">
                    {leaderboard[1].name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 text-sm">🥈</span>
              </div>
              <p className="text-xs font-bold text-[#1E2A4A] truncate max-w-full">
                {leaderboard[1].name.split(" ")[0]}
              </p>
              <p className="font-mono text-[11px] text-[#33363D]/70">{leaderboard[1].totalScore} pts</p>
              <div className="w-full bg-[#94A3B8]/20 border border-[#94A3B8]/40 rounded-t-lg h-16 flex items-center justify-center mt-1">
                <span className="font-heading font-bold text-[#33363D] text-lg">#2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Center & Highest) */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl animate-bounce">
                  👑
                </span>
                <div className="w-14 h-14 rounded-full bg-[#1E2A4A] border-3 border-[#E8A33D] flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-semibold font-mono">
                    {leaderboard[0].name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 text-base">🥇</span>
              </div>
              <p className="text-xs font-bold text-[#1E2A4A] truncate max-w-full">
                {leaderboard[0].name.split(" ")[0]}
              </p>
              <p className="font-mono text-xs font-bold text-[#E8A33D]">{leaderboard[0].totalScore} pts</p>
              <div className="w-full bg-[#E8A33D]/25 border-2 border-[#E8A33D] rounded-t-lg h-22 flex flex-col items-center justify-center mt-1">
                <span className="font-heading font-bold text-[#1E2A4A] text-xl">#1</span>
                <span className="text-[9px] font-bold text-[#1E2A4A] uppercase tracking-wider">Topper</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="w-12 h-12 rounded-full bg-[#1E2A4A] border-2 border-[#D97706] flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-semibold font-mono">
                    {leaderboard[2].name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 text-sm">🥉</span>
              </div>
              <p className="text-xs font-bold text-[#1E2A4A] truncate max-w-full">
                {leaderboard[2].name.split(" ")[0]}
              </p>
              <p className="font-mono text-[11px] text-[#33363D]/70">{leaderboard[2].totalScore} pts</p>
              <div className="w-full bg-[#D97706]/20 border border-[#D97706]/40 rounded-t-lg h-12 flex items-center justify-center mt-1">
                <span className="font-heading font-bold text-[#33363D] text-lg">#3</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Scope Filter Chips ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Chip label={t("filter_class")} active={scope === "class"} onClick={() => setScope("class")} />
          <Chip label={t("filter_dept")} active={scope === "dept"} onClick={() => setScope("dept")} />
          <Chip label={t("filter_college")} active={scope === "college"} onClick={() => setScope("college")} />
        </div>

        {/* ── Leaderboard Table / Cards ───────────────────────────────── */}
        <div className="space-y-2">
          {leaderboard.map((student, idx) => {
            const isMe = student.studentId === session.id;
            const rank = idx + 1;

            return (
              <div
                key={student.studentId}
                className={[
                  "flex items-center gap-3 bg-white rounded-xl border p-3.5 transition-colors",
                  isMe
                    ? "border-[#E8A33D] bg-[#E8A33D]/5 shadow-sm"
                    : "border-[#33363D]/10 hover:border-[#33363D]/25",
                ].join(" ")}
              >
                {/* Rank Number & Delta */}
                <div className="w-8 flex flex-col items-center justify-center shrink-0">
                  <span
                    className={[
                      "font-heading font-bold text-base",
                      rank === 1
                        ? "text-[#E8A33D]"
                        : rank === 2
                        ? "text-[#64748B]"
                        : rank === 3
                        ? "text-[#D97706]"
                        : "text-[#1E2A4A]",
                    ].join(" ")}
                  >
                    #{rank}
                  </span>
                  {student.rankChange > 0 ? (
                    <span className="text-[10px] text-[#4C7A5E] font-bold">▲{student.rankChange}</span>
                  ) : student.rankChange < 0 ? (
                    <span className="text-[10px] text-[#B4483A] font-bold">▼{Math.abs(student.rankChange)}</span>
                  ) : (
                    <span className="text-[10px] text-[#33363D]/40 font-bold">▬</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0 text-white text-xs font-semibold font-mono">
                  {student.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>

                {/* Name & Badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-[#1E2A4A] truncate">{student.name}</p>
                    {isMe && (
                      <span className="text-[10px] font-bold bg-[#E8A33D] text-[#1E2A4A] px-1.5 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#33363D]/60 mt-0.5">
                    SPI {student.spi} · Att {student.attendancePct}% · {student.department.split(" ")[0]}
                  </p>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {student.badges.map((b) => (
                      <span
                        key={b.label}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-[#FAF8F4] border border-[#33363D]/10 px-1.5 py-0.5 rounded text-[#1E2A4A]"
                      >
                        <span>{b.icon}</span> {b.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Zeal Score */}
                <div className="text-right shrink-0">
                  <p className="font-mono text-base font-bold text-[#1E2A4A]">
                    {isMe ? dynamicScore : student.totalScore}
                  </p>
                  <p className="text-[10px] text-[#33363D]/50 uppercase tracking-wider">
                    {t("points")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Scoring Methodology Drawer ──────────────────────────────── */}
      <Drawer
        open={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        title={t("how_scoring_works")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#33363D]/70 leading-relaxed">
            The <strong>Zeal Score (1000 pts max)</strong> is calculated transparently using university academic performance, classroom attendance, and extracurricular achievements.
          </p>

          <div className="space-y-3">
            <Card className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1E2A4A]">📚 1. {t("academic_pts")}</span>
                <span className="font-mono text-xs font-bold text-[#E8A33D]">500 pts max</span>
              </div>
              <p className="text-xs text-[#33363D]/60 leading-relaxed">
                Based on CIE 1, 2, and 3 internal assessments, semester SPI grade points (out of 10), and laboratory practical evaluations.
              </p>
            </Card>

            <Card className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1E2A4A]">⏱️ 2. {t("attendance_pts")}</span>
                <span className="font-mono text-xs font-bold text-[#4C7A5E]">300 pts max</span>
              </div>
              <p className="text-xs text-[#33363D]/60 leading-relaxed">
                Calculated directly from QR check-in records. Maintaining 90%+ grants bonus consistency multipliers.
              </p>
            </Card>

            <Card className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1E2A4A]">🚀 3. {t("activity_pts")}</span>
                <span className="font-mono text-xs font-bold text-[#60A5FA]">200 pts max</span>
              </div>
              <p className="text-xs text-[#33363D]/60 leading-relaxed">
                Points awarded for ZENITH technical fest participation, coding contests, sports, student council activities, and library study hours.
              </p>
            </Card>
          </div>

          <div className="p-3 bg-[#E8A33D]/10 rounded-lg border border-[#E8A33D]/20 text-xs text-[#1E2A4A] space-y-1">
            <p className="font-semibold">🌟 Rewards for Top 3 Scholars:</p>
            <p>• Gold Trophy and Dean&apos;s Merit Certificate at Annual Day</p>
            <p>• Priority campus placement interview slotting with Tier-1 recruiters</p>
            <p>• SPPU Academic Excellence recommendation letters</p>
          </div>

          <Button variant="primary" fullWidth onClick={() => setShowHowItWorks(false)}>
            {t("close")}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
