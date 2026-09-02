"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { students } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { validateScannedQR } from "@/lib/qr/qrValidator";
import { recordStudentCheckIn } from "@/lib/qr/qrSession";
import { ValidationResult, QRPayload } from "@/lib/qr/qrTypes";
import { QRScanner } from "@/components/qr/QRScanner";
import { AttendanceResult } from "@/components/qr/AttendanceResult";
import { getLiveSession, subscribeToLiveSession } from "@/lib/qr/liveSessionState";
import { getOrCreateDeviceId } from "@/lib/qr/qrStorage";

export default function CheckInPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [liveSession, setLiveSession] = useState<ReturnType<typeof getLiveSession> | null>(null);

  useEffect(() => {
    setMounted(true);
    setLiveSession(getLiveSession());
    const refreshServerSession = async () => {
      try {
        const response = await fetch("/api/session/current", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.session) setLiveSession(data.session);
      } catch {
        // localStorage fallback is still available when Supabase is offline.
      }
    };
    void refreshServerSession();
    const poll = window.setInterval(refreshServerSession, 5000);
    const unsubscribe = subscribeToLiveSession((session) => setLiveSession(session));
    return () => {
      window.clearInterval(poll);
      unsubscribe();
    };
  }, []);

  const session = getSession();
  const currentStudent = session ? students.find((s) => s.id === session.id) : null;
  const studentId = session?.id ?? "72201234M";
  const studentName = currentStudent?.name ?? "Aarav Sharma";

  const handleScan = useCallback(
    (decodedText: string) => {
      const result = validateScannedQR(decodedText, studentId);

      if (result.valid && result.payload) {
        const payload = result.payload as QRPayload;
        const submitToServer = (latitude?: number, longitude?: number, accuracy?: number) => {
          const deviceId = getOrCreateDeviceId();
          const deviceCookie = fetch("/api/device", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ deviceId }),
          }).catch(() => undefined);
          void deviceCookie.then(() => fetch("/api/verify-scan", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sessionId: payload.sessionId,
              signedToken: payload.signedToken,
              deviceId,
              studentId,
              latitude,
              longitude,
              gpsAccuracyM: accuracy ?? 20,
            }),
          }))
            .then(async (response) => {
              const serverResult = await response.json().catch(() => null);
              if (!response.ok && serverResult?.code !== "schema_unavailable") {
                const reason = serverResult?.reasonCode || "server_error";
                setValidationResult({
                  valid: false,
                  status: reason === "session_closed" ? "SESSION_CLOSED" : reason === "token_expired" ? "EXPIRED" : "INVALID_FORMAT",
                  payload,
                  errorMessage: serverResult?.message || "Attendance verification failed. Please try again.",
                });
                return;
              }
              if (response.ok && serverResult?.success) {
                setValidationResult({
                  valid: serverResult.status !== "already_marked",
                  status: serverResult.status === "already_marked" ? "ALREADY_MARKED" : "VALID",
                  payload,
                  errorMessage: serverResult.message,
                });
                return;
              }
              // No schema/configuration: preserve the offline/demo experience.
              recordStudentCheckIn(payload, studentId, studentName, "qr-camera");
              setValidationResult(result);
            })
            .catch(() => {
              recordStudentCheckIn(payload, studentId, studentName, "qr-camera");
              setValidationResult(result);
            });
        };

        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              submitToServer(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
            },
            () => {
              setValidationResult({
                valid: false,
                status: "INVALID_FORMAT",
                payload,
                errorMessage: "Location permission is required to mark attendance inside the classroom geofence.",
              });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
          return;
        }

        submitToServer(payload.latitude, payload.longitude);
        return;
      }

      setValidationResult(result);
    },
    [studentId, studentName]
  );

  const handleDismissResult = () => {
    setValidationResult(null);
  };

  const handleAutoReturn = () => {
    router.push("/student");
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#131C33] flex flex-col justify-between p-4 md:p-6 z-40 text-white select-none overflow-y-auto">
      {/* ── Result Takeover Screens ─────────────────────────────────── */}
      {validationResult && (
        <AttendanceResult
          result={validationResult}
          onDismiss={handleDismissResult}
          onAutoReturn={handleAutoReturn}
        />
      )}

      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between z-10 pt-2">
        <Link
          href="/student"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Back to dashboard"
        >
          ✕
        </Link>

        <div className="text-center">
          <p className="font-heading font-bold text-base text-white">Attendance Check-In</p>
          <p className="text-[11px] text-white/60">ZCOER Autonomous System</p>
        </div>

        <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A5E] animate-ping" title="Camera Active" />
      </div>

      {/* ── Main Camera & Fallback Scanner ──────────────────────────── */}
      <div className="my-auto py-4">
        <QRScanner onScan={handleScan} />
      </div>

      {/* ── Bottom Info ─────────────────────────────────────────────── */}
      <div className="w-full max-w-sm mx-auto text-center pb-2 space-y-2">
        <p className="text-[11px] text-[#DDE6FF] font-semibold">
          {liveSession ? `${liveSession.subject} • ${liveSession.room}` : "Waiting for the teacher to start a live lecture session..."}
        </p>
        <p className="text-[11px] text-white/50 leading-relaxed">
          Point your camera at the teacher&apos;s active 30s QR code. Duplicate scans are automatically prevented.
        </p>
      </div>
    </div>
  );
}
