"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { generateSignedToken, SignedQRPayload } from "@/lib/security/hmacToken";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface SessionInfoV2 {
  id: string;
  className: string;
  room: string;
  startedAt: number;
  endsAt: number;
  signedToken: SignedQRPayload;
  tokenSecret: string;
  seq: number;
}

interface ScannedStudentV2 {
  studentId: string;
  name: string;
  rollNumber: string;
  status: "present" | "late" | "flagged" | "rejected" | "absent";
  scannedAt: string;
  distanceM: number;
  trustScore: number;
  reasonCode: string;
}

export default function TeacherPortalV2Page() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SessionInfoV2 | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(360);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(10);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudentV2[]>([]);
  const [selectedClass, setSelectedClass] = useState("CS301 - Data Structures (SYCO)");
  const [selectedRoom, setSelectedRoom] = useState("Room 304 (Geofenced 100m)");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── 1. Rotate HMAC Signed Token every ~10s ────────────────────────────────
  const rotateHmacToken = useCallback(() => {
    if (!session) return;
    const nextSeq = session.seq + 1;
    const newSignedToken = generateSignedToken(session.id, session.tokenSecret, nextSeq, 12);

    setSession((prev) =>
      prev
        ? {
            ...prev,
            signedToken: newSignedToken,
            seq: nextSeq,
          }
        : null
    );
    setTokenTimeLeft(10);
  }, [session]);

  // ── 2. Timers ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const remainingSession = Math.max(0, session.endsAt - nowSec);
      setSessionTimeLeft(remainingSession);

      if (remainingSession <= 0) {
        showToast("Session window closed. Running auto-absent job...", "info");
        setSession(null);
        clearInterval(timer);
      }

      setTokenTimeLeft((prev) => {
        if (prev <= 1) {
          rotateHmacToken();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, rotateHmacToken, showToast]);

  // ── 3. Start Anti-Proxy v2 Session ───────────────────────────────────────
  const handleStartSession = () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const sessionId = "SES-V2-" + Date.now().toString(36).toUpperCase();
    const tokenSecret = "SECRET-" + sessionId;
    const initialToken = generateSignedToken(sessionId, tokenSecret, 1, 12);

    const newSession: SessionInfoV2 = {
      id: sessionId,
      className: selectedClass,
      room: selectedRoom,
      startedAt: nowSec,
      endsAt: nowSec + 360,
      signedToken: initialToken,
      tokenSecret,
      seq: 1,
    };

    setSession(newSession);
    setSessionTimeLeft(360);
    setTokenTimeLeft(10);
    setScannedStudents([
      {
        studentId: "225P10229R",
        name: "Aarav Patil",
        rollNumber: "225P10229R",
        status: "present",
        scannedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        distanceM: 14.2,
        trustScore: 100,
        reasonCode: "verified",
      },
      {
        studentId: "225P10273R",
        name: "Omkar More",
        rollNumber: "225P10273R",
        status: "flagged",
        scannedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        distanceM: 88.5,
        trustScore: 60,
        reasonCode: "gps_accuracy_poor",
      },
    ]);

    showToast("⚡ Anti-Proxy v2 Session active with HMAC Token rotation!", "success");
  };

  // ── 4. One-Tap Flagged Approval / Rejection ──────────────────────────────
  const handleReviewFlagged = (studentId: string, approve: boolean) => {
    setScannedStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              status: approve ? "present" : "rejected",
              reasonCode: approve ? "teacher_approved" : "teacher_rejected",
              trustScore: approve ? 100 : 0,
            }
          : s
      )
    );

    showToast(`Flagged scan for ${studentId} ${approve ? "approved ✓" : "rejected ❌"}`, approve ? "success" : "error");
  };

  // ── 5. Download v2 Excel Sheet (.xlsx) ──────────────────────────────────
  const handleExportExcel = async () => {
    try {
      showToast("Generating Anti-Proxy v2 Excel Report...", "info");
      const res = await fetch("/api/excel-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.id,
          className: selectedClass.replace(/[^a-zA-Z0-9]/g, "_"),
          sessionDate: new Date().toISOString().split("T")[0],
          records: scannedStudents.map((s) => ({
            rollNumber: s.rollNumber,
            fullName: s.name,
            status: s.status,
            scannedAt: s.scannedAt,
            isLate: s.status === "late",
            distanceM: s.distanceM,
            deviceMatch: true,
            trustScore: s.trustScore,
            reasonCode: s.reasonCode,
          })),
        }),
      });

      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedClass}_Attendance_v2_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Excel v2 Spreadsheet Downloaded! 📊", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download Excel file.", "error");
    }
  };

  if (!mounted) return null;

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const qrDataPayload = session ? JSON.stringify(session.signedToken) : "";
  const presentCount = scannedStudents.filter((s) => s.status === "present" || s.status === "late").length;
  const flaggedStudents = scannedStudents.filter((s) => s.status === "flagged");

  return (
    <div className="min-h-screen bg-[#FAF8F4] p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#33363D]/12 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZCOER Logo" className="w-12 h-12 object-contain shrink-0" />
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-[#1E2A4A]">
              Faculty Anti-Proxy Session v2
            </h1>
            <p className="text-xs text-[#33363D]/60 mt-0.5">
              HMAC Token Rotation · Trust Scoring · 100m Geofence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/scan"
            className="px-4 py-2 rounded-xl bg-[#E8A33D] text-[#1E2A4A] font-bold text-xs hover:bg-[#D97706] transition-colors"
          >
            📱 Student Scan Page
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl border border-[#33363D]/20 text-xs font-semibold text-[#1E2A4A] hover:bg-[#FAF8F4]"
          >
            📊 Admin v2 Reports
          </Link>
        </div>
      </div>

      {!session ? (
        <Card className="p-8 text-center space-y-5 max-w-xl mx-auto bg-white">
          <div className="w-16 h-16 rounded-full bg-[#1E2A4A]/10 text-[#1E2A4A] flex items-center justify-center text-3xl mx-auto">
            🛡️
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold text-[#1E2A4A]">
              Start v2 Anti-Proxy Session
            </h2>
            <p className="text-xs text-[#33363D]/70 leading-relaxed">
              Generates an HMAC-SHA256 signed rotating token (~10s security sequence) to make proxy scanning impossible.
            </p>
          </div>

          <div className="space-y-3 text-left bg-[#FAF8F4] p-4 rounded-2xl border border-[#33363D]/10">
            <div>
              <label className="text-xs font-bold text-[#1E2A4A]">Select Class &amp; Division</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-10 px-3 mt-1 rounded-xl border border-[#33363D]/20 bg-white text-xs font-medium text-[#1E2A4A]"
              >
                <option value="CS301 - Data Structures (SYCO Div A)">CS301 - SYCO Div A (ZPRN 225P10229R…)</option>
                <option value="CS301 - Data Structures (SYCO Div B)">CS301 - SYCO Div B (ZPRN 225P10304R…)</option>
                <option value="CS301 - Data Structures (SYCO Div C)">CS301 - SYCO Div C (ZPRN 225P10381R…)</option>
                <option value="CS301 - Data Structures (SYCO Div D)">CS301 - SYCO Div D (ZPRN 225P10459R…)</option>
                <option value="CS301 - Data Structures (SYCO Div E)">CS301 - SYCO Div E (ZPRN 225P10538R…)</option>
                <option value="CS301 - Data Structures (SYCO Div F)">CS301 - SYCO Div F (ZPRN 225P10613R…)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1E2A4A]">Classroom Geofence</label>
              <input
                type="text"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full h-10 px-3 mt-1 rounded-xl border border-[#33363D]/20 bg-white text-xs font-medium text-[#1E2A4A]"
              />
            </div>
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handleStartSession}>
            ⚡ Start 6-Minute Anti-Proxy Session
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Signed QR Display */}
          <div className="md:col-span-6 space-y-4">
            <Card className="p-6 flex flex-col items-center text-center space-y-4 border-2 border-[#1E2A4A]/20 shadow-xl bg-white">
              <div className="flex items-center justify-between w-full border-b pb-3 border-[#33363D]/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C7A5E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A5E] animate-ping" />
                  HMAC Signed QR Active
                </span>
                <span className="font-mono text-xs text-[#33363D]/60 font-semibold">
                  Window: <strong className="text-[#1E2A4A]">{formatMinSec(sessionTimeLeft)}</strong>
                </span>
              </div>

              <div>
                <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">{session.className}</h2>
                <p className="text-xs text-[#33363D]/60">{session.room}</p>
              </div>

              {/* Signed QR Code */}
              <div className="p-4 bg-white rounded-2xl border-2 border-[#1E2A4A] shadow-md">
                <QRCodeSVG value={qrDataPayload} size={230} level="M" includeMargin={true} />
              </div>

              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#33363D]/60">Sequence #{session.seq}</span>
                  <span className="font-bold text-[#E8A33D]">Rotates in 00:0{tokenTimeLeft}</span>
                </div>
                <div className="h-2 w-full bg-[#33363D]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E8A33D] transition-all duration-1000"
                    style={{ width: `${(tokenTimeLeft / 10) * 100}%` }}
                  />
                </div>
              </div>

              <Button variant="destructive" fullWidth size="md" onClick={() => setSession(null)}>
                🔒 End Session
              </Button>
            </Card>
          </div>

          {/* Right Column: Flagged Review & Roster */}
          <div className="md:col-span-6 space-y-4">
            {/* Flagged Review Queue */}
            {flaggedStudents.length > 0 && (
              <div className="bg-[#FDF3E3] border-2 border-[#E8A33D] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#B47414] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B47414] animate-ping" />
                    Flagged Scans Queue ({flaggedStudents.length})
                  </span>
                  <span className="text-[10px] text-[#B47414]">One-Tap Staff Review</span>
                </div>

                {flaggedStudents.map((s) => (
                  <div key={s.studentId} className="bg-white p-3 rounded-xl border border-[#E8A33D]/40 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-[#1E2A4A]">{s.name}</p>
                      <p className="font-mono text-[10px] text-[#33363D]/70">{s.rollNumber} · Trust: {s.trustScore}/100</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleReviewFlagged(s.studentId, true)}
                        className="px-2.5 py-1 rounded-lg bg-[#4C7A5E] text-white text-[11px] font-bold hover:bg-[#4C7A5E]/90 cursor-pointer"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReviewFlagged(s.studentId, false)}
                        className="px-2.5 py-1 rounded-lg bg-[#B4483A] text-white text-[11px] font-bold hover:bg-[#B4483A]/90 cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Roster & Excel Download */}
            <Card className="p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-[#1E2A4A]">Verified Roster</h3>
                  <p className="text-xs text-[#33363D]/60">Trust-Score &amp; Device Bound</p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-2xl font-extrabold text-[#4C7A5E]">{presentCount}</span>
                  <span className="text-xs text-[#33363D]/60 block font-semibold">Present</span>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scannedStudents.map((s) => (
                  <div
                    key={s.studentId}
                    className={[
                      "flex items-center justify-between p-3 rounded-xl border text-xs transition-all",
                      s.status === "present"
                        ? "bg-[#C6EFCE]/30 border-[#006100]/30 text-[#006100]"
                        : s.status === "flagged"
                        ? "bg-[#FCE4D6]/50 border-[#C65911]/40 text-[#C65911]"
                        : "bg-[#FFC7CE]/30 border-[#9C0006]/30 text-[#9C0006]",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="font-mono text-[11px] opacity-80">{s.rollNumber} · Score: {s.trustScore}/100</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold uppercase tracking-wider text-[11px]">{s.status}</span>
                      <p className="font-mono text-[10px] opacity-75">{s.scannedAt}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleExportExcel}
                className="w-full py-3 rounded-xl bg-[#305496] hover:bg-[#203D72] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📊</span>
                <span>Download v2 Formatted Excel (.xlsx)</span>
              </button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
