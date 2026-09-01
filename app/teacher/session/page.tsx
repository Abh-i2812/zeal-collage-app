"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSubject, getSessionRoster } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AttendanceSession } from "@/lib/qr/qrTypes";
import {
  createAttendanceSession,
  rotateSessionToken,
  closeAttendanceSession,
  getCurrentQRPayload,
} from "@/lib/qr/qrSession";
import {
  getSessionById,
  updateStudentRecordStatus,
} from "@/lib/qr/qrStorage";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { QRCountdown } from "@/components/qr/QRCountdown";
import { QRStatus } from "@/components/qr/QRStatus";
import { exportSessionAttendanceToExcel } from "@/lib/excelExport";

export default function TeacherSessionPage() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { showToast } = useToast();

  const subjectId = searchParams.get("sub") ?? "SUB001";
  const room = searchParams.get("room") ?? "Room 304";
  const subject = getSubject(subjectId);

  const [activeTab, setActiveTab] = useState<"qr" | "roster">("qr");
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [roster, setRoster] = useState<{ studentId: string; name: string; status: "present" | "absent" | "unset"; flagged?: boolean }[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize roster from mockDb
  useEffect(() => {
    setMounted(true);
    setRoster(getSessionRoster(subjectId));
  }, [subjectId]);

  // Sync roster with real localStorage attendance records every second
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const liveSession = getSessionById(session.sessionId);
      if (liveSession) {
        setSession(liveSession);

        // Update roster with present students
        setRoster((prev) =>
          prev.map((r) => {
            const isMarkedPresent = liveSession.attendance.includes(r.studentId);
            const isFlagged =
              (liveSession.flaggedDevices &&
                liveSession.flaggedDevices[r.studentId] &&
                liveSession.flaggedDevices[r.studentId].length > 1) ||
              r.flagged;

            return {
              ...r,
              status: isMarkedPresent ? "present" : r.status,
              flagged: isFlagged,
            };
          })
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleStartSession = () => {
    let latitude = 18.4485;
    let longitude = 73.834;
    let radiusM = 5;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          radiusM = 5;
          const newSession = createAttendanceSession(
            subjectId,
            subject?.name ?? "Database Management Systems",
            "TCH001",
            room,
            latitude,
            longitude,
            radiusM
          );
          setSession(newSession);
          showToast("Attendance session started with live room GPS lock (5m geofence).", "success");
        },
        () => {
          const newSession = createAttendanceSession(
            subjectId,
            subject?.name ?? "Database Management Systems",
            "TCH001",
            room,
            latitude,
            longitude,
            radiusM
          );
          setSession(newSession);
          showToast("Attendance session started using default classroom GPS coordinates (5m geofence).", "success");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return;
    }

    const newSession = createAttendanceSession(
      subjectId,
      subject?.name ?? "Database Management Systems",
      "TCH001",
      room,
      latitude,
      longitude,
      radiusM
    );
    setSession(newSession);
    showToast("Attendance session started. Real dynamic QR generated!", "success");
  };

  const handleRotate = useCallback(() => {
    if (!session || session.status !== "active") return;
    const updated = rotateSessionToken(session.sessionId);
    if (updated) {
      setSession({ ...updated });
    }
  }, [session]);

  const handleCloseSession = () => {
    if (!session) return;
    const closed = closeAttendanceSession(session.sessionId);
    if (closed) {
      setSession({ ...closed });
      showToast("Attendance session closed successfully.", "info");
    }
  };

  const handleManualToggle = (studentId: string, currentStatus: string, studentName: string) => {
    const nextStatus = currentStatus === "present" ? "absent" : "present";

    if (session) {
      updateStudentRecordStatus(
        session.sessionId,
        studentId,
        nextStatus,
        studentName,
        subjectId,
        subject?.name ?? "Lecture",
        room
      );
    }

    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: nextStatus } : r))
    );

    showToast(`${studentName} marked ${nextStatus}`, "info");
  };

  const handleExportExcel = () => {
    if (!session) return;
    exportSessionAttendanceToExcel(
      session.sessionId,
      subject?.name ?? "Lecture",
      room,
      roster
    );
    showToast("Attendance Excel file downloaded! 📊", "success");
  };

  if (!mounted) return null;

  const presentCount = roster.filter((r) => r.status === "present").length;
  const flaggedCount = roster.filter((r) => r.flagged).length;
  const qrPayload = session ? getCurrentQRPayload(session) : null;

  return (
    <div className="px-4 py-5 md:py-6 space-y-5 max-w-4xl mx-auto">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#33363D]/12 p-4 md:p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            {session?.status === "active" ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A5E] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C7A5E]">
                  ACTIVE LECTURE SESSION
                </span>
              </>
            ) : session?.status === "closed" ? (
              <span className="text-xs font-bold uppercase tracking-wider text-[#B4483A]">
                SESSION CLOSED
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-[#33363D]/60">
                READY TO START
              </span>
            )}
          </div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-[#1E2A4A] mt-1">
            {subject?.name ?? "Database Systems"}
          </h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">
            {room} · Third Year (Div A) · Batch A1 &amp; A2
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1E2A4A]/70 mt-2">
            {session ? `GPS lock: ${session.latitude?.toFixed(4) ?? "18.4485"}, ${session.longitude?.toFixed(4) ?? "73.8340"} · ${session.geofenceRadiusM ?? 5}m geofence` : "Location-embedded QR · 5m classroom radius"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session?.status === "active" && (
            <button
              onClick={handleCloseSession}
              className="px-4 py-2 rounded-xl bg-[#B4483A]/10 border border-[#B4483A]/30 text-xs font-bold text-[#B4483A] hover:bg-[#B4483A]/20 transition-colors cursor-pointer"
            >
              🔒 Close Session
            </button>
          )}
          <Link
            href="/teacher"
            className="px-4 py-2 rounded-xl border border-[#33363D]/20 text-xs font-semibold text-[#1E2A4A] hover:bg-[#FAF8F4] transition-colors"
          >
            ← Back to Today
          </Link>
        </div>
      </div>

      {/* ── BEFORE STARTING STATE ────────────────────────────────────── */}
      {!session && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E8A33D]/15 flex items-center justify-center text-3xl mx-auto">
            📡
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-heading text-xl font-bold text-[#1E2A4A]">
              Start Attendance Session
            </h2>
            <p className="text-xs text-[#33363D]/70 leading-relaxed">
              Click below to generate a real, scannable QR code that automatically rotates every 30 seconds to prevent proxy attendance.
            </p>
          </div>

          <div className="pt-2 max-w-xs mx-auto">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleStartSession}
            >
              ⚡ Start Attendance Session
            </Button>
          </div>
        </Card>
      )}

      {/* ── ACTIVE / CLOSED SESSION TABS ─────────────────────────────── */}
      {session && (
        <>
          {/* Tab Switcher & Status Bar */}
          <div className="space-y-3">
            <div className="flex bg-white p-1 rounded-2xl border border-[#33363D]/12 shadow-2xs">
              {(["qr", "roster"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "flex-1 h-11 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                    activeTab === tab
                      ? "bg-[#1E2A4A] text-white shadow-sm"
                      : "text-[#33363D]/70 hover:text-[#1E2A4A]",
                  ].join(" ")}
                >
                  <span>{tab === "qr" ? "📡" : "📋"}</span>
                  <span>
                    {tab === "qr"
                      ? t("qr_display")
                      : `${t("roster")} (${presentCount}/${roster.length})`}
                  </span>
                </button>
              ))}
            </div>

            <QRStatus
              status={session.status}
              presentCount={presentCount}
              totalCount={roster.length}
              flaggedCount={flaggedCount}
              className="bg-white p-3.5 rounded-2xl border border-[#33363D]/12"
            />
          </div>

          {/* ── QR Display Tab ───────────────────────────────────────── */}
          {activeTab === "qr" && (
            <Card className="p-6 md:p-8 flex flex-col items-center gap-6 text-center">
              {session.status === "active" && qrPayload ? (
                <>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#E8A33D] uppercase tracking-wider">
                      Live Classroom QR Code
                    </span>
                    <h2 className="font-heading text-xl font-bold text-[#1E2A4A]">
                      Point your mobile camera to mark attendance
                    </h2>
                  </div>

                  {/* Real QR Display */}
                  <QRCodeDisplay payload={qrPayload} size={260} />

                  {/* 30s Countdown Timer */}
                  <QRCountdown
                    expiresAt={session.activeTokenExpiresAt}
                    onExpire={handleRotate}
                  />

                  {flaggedCount > 0 && (
                    <div className="w-full max-w-md rounded-2xl bg-[#B4483A]/10 border border-[#B4483A]/25 p-3.5 text-xs text-[#B4483A] flex items-center gap-2 text-left">
                      <span className="text-lg shrink-0">⚠️</span>
                      <span>
                        <strong>{flaggedCount} student</strong> scanned from multiple devices. Check details in Roster tab.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#33363D]/10 flex items-center justify-center text-3xl mx-auto">
                    🔒
                  </div>
                  <h2 className="font-heading text-xl font-bold text-[#1E2A4A]">
                    Attendance Session Closed
                  </h2>
                  <p className="text-xs text-[#33363D]/60 max-w-sm">
                    {presentCount} of {roster.length} students have been recorded present. You can view or adjust the final roster below.
                  </p>
                  <Button variant="secondary" onClick={() => setActiveTab("roster")}>
                    View Final Class Roster ➔
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* ── Class Roster Tab ─────────────────────────────────────── */}
          {activeTab === "roster" && (
            <div className="space-y-4">
              {flaggedCount > 0 && (
                <div className="rounded-2xl bg-[#B4483A]/10 border border-[#B4483A]/25 p-3.5 text-xs text-[#B4483A] space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚠️ Multiple Device Activity Detected</span>
                  </p>
                  <p className="leading-relaxed">
                    The following students scanned from multiple browser sessions: <strong>Arjun Nair (72201238M)</strong>. You can manually adjust their status below.
                  </p>
                </div>
              )}

              {/* Roster List */}
              <div className="space-y-2">
                {roster.map((entry) => (
                  <div
                    key={entry.studentId}
                    className={[
                      "flex items-center gap-3 bg-white rounded-2xl border p-3.5 transition-all",
                      entry.flagged ? "border-[#B4483A]/40 bg-[#B4483A]/5" : "border-[#33363D]/10",
                    ].join(" ")}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1E2A4A] text-white flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                      {entry.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1E2A4A] truncate">{entry.name}</p>
                        {entry.flagged && (
                          <span className="text-[10px] font-bold text-[#B4483A] bg-[#B4483A]/15 px-1.5 py-0.2 rounded">
                            ⚑ 2 DEVICES
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-[#33363D]/60">{entry.studentId}</p>
                    </div>

                    {/* Manual Status Toggle */}
                    <button
                      onClick={() => handleManualToggle(entry.studentId, entry.status, entry.name)}
                      className={[
                        "h-10 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none",
                        entry.status === "present"
                          ? "bg-[#4C7A5E] border-[#4C7A5E] text-white shadow-xs"
                          : "bg-[#FAF8F4] border-[#33363D]/20 text-[#33363D]/60 hover:border-[#33363D]/40",
                      ].join(" ")}
                    >
                      {entry.status === "present" ? "✓ Present" : "Mark Present"}
                    </button>
                  </div>
                ))}
              </div>

              {session.status === "active" && (
                <Button
                  variant="destructive"
                  fullWidth
                  size="lg"
                  onClick={handleCloseSession}
                >
                  🔒 Close Attendance Session
                </Button>
              )}

              {/* Excel Export — always visible once session exists */}
              <button
                onClick={handleExportExcel}
                className="w-full h-12 rounded-2xl border-2 border-[#4C7A5E] text-[#4C7A5E] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#4C7A5E] hover:text-white transition-all cursor-pointer"
              >
                <span>📊</span>
                <span>Download Attendance as Excel (.xlsx)</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
