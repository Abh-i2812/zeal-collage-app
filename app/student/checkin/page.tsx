"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { students } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { validateScannedQR } from "@/lib/qr/qrValidator";
import { recordStudentCheckIn } from "@/lib/qr/qrSession";
import { ValidationResult } from "@/lib/qr/qrTypes";
import { QRScanner } from "@/components/qr/QRScanner";
import { AttendanceResult } from "@/components/qr/AttendanceResult";

export default function CheckInPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const session = getSession();
  const currentStudent = session ? students.find((s) => s.id === session.id) : null;
  const studentId = session?.id ?? "72201234M";
  const studentName = currentStudent?.name ?? "Aarav Sharma";

  const handleScan = useCallback(
    (decodedText: string) => {
      // Step 1: Validate payload
      const result = validateScannedQR(decodedText, studentId);
      setValidationResult(result);

      // Step 2: If valid, save to localStorage
      if (result.valid && result.payload) {
        recordStudentCheckIn(result.payload, studentId, studentName, "qr-camera");
      }
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
      <div className="w-full max-w-sm mx-auto text-center pb-2">
        <p className="text-[11px] text-white/50 leading-relaxed">
          Point your camera at the teacher&apos;s active 30s QR code. Duplicate scans are automatically prevented.
        </p>
      </div>
    </div>
  );
}
