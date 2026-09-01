"use client";
import { useEffect } from "react";
import { ValidationResult } from "@/lib/qr/qrTypes";
import { Button } from "@/components/ui/Button";

interface AttendanceResultProps {
  result: ValidationResult;
  onDismiss: () => void;
  onAutoReturn?: () => void;
}

export function AttendanceResult({
  result,
  onDismiss,
  onAutoReturn,
}: AttendanceResultProps) {
  // Auto-return on success after 2 seconds
  useEffect(() => {
    if (result.status === "VALID" && onAutoReturn) {
      const timer = setTimeout(onAutoReturn, 1200);
      return () => clearTimeout(timer);
    }
  }, [result.status, onAutoReturn]);

  const formattedNow = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── SUCCESS (VALID) ────────────────────────────────────────────────
  if (result.status === "VALID") {
    return (
      <div className="fixed inset-0 bg-[#4C7A5E] z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-[fadeIn_0.2s_ease-out]">
        <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center shadow-2xl animate-bounce mb-6">
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="space-y-2 max-w-sm">
          <p className="text-sm uppercase tracking-widest text-white/80 font-bold">Attendance Recorded</p>
          <h1 className="font-heading text-3xl font-extrabold">You&apos;re marked PRESENT</h1>
          
          <div className="py-4 my-2 border-y border-white/20 space-y-1">
            <p className="text-xl font-bold">{result.payload?.subject ?? "Lecture"}</p>
            <p className="text-sm text-white/80">{result.payload?.room ?? "Classroom"}</p>
            <p className="font-mono text-xs text-white/70">Time: {formattedNow}</p>
          </div>
        </div>

        <p className="text-xs text-white/60 mt-6 animate-pulse">
          Returning to dashboard in 1s…
        </p>
      </div>
    );
  }

  // ── DUPLICATE SCAN (ALREADY MARKED) ─────────────────────────────────
  if (result.status === "ALREADY_MARKED") {
    return (
      <div className="fixed inset-0 bg-[#D97706] z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-[fadeIn_0.2s_ease-out]">
        <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-4xl shadow-xl mb-6">
          ⚠️
        </div>

        <div className="space-y-3 max-w-sm">
          <h1 className="font-heading text-2xl font-bold">Already Marked</h1>
          <p className="text-sm text-white/90 leading-relaxed">
            Your attendance for <strong>{result.payload?.subject}</strong> has already been recorded.
          </p>
          {result.markedTime && (
            <p className="font-mono text-xs bg-black/15 py-1.5 px-3 rounded-lg inline-block">
              Recorded at {result.markedTime}
            </p>
          )}
          <p className="text-xs text-white/70 pt-2">
            Duplicate scan prevented. Your original attendance remains saved.
          </p>
        </div>

        <div className="mt-8 w-full max-w-xs">
          <button
            onClick={onDismiss}
            className="w-full h-12 rounded-xl bg-white text-[#D97706] font-bold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  // ── EXPIRED QR CODE ────────────────────────────────────────────────
  if (result.status === "EXPIRED") {
    return (
      <div className="fixed inset-0 bg-[#B4483A] z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-[fadeIn_0.2s_ease-out]">
        <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center shadow-xl mb-6">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <div className="space-y-3 max-w-sm">
          <h1 className="font-heading text-2xl font-bold">QR Code Expired</h1>
          <p className="text-sm text-white/90 leading-relaxed">
            This 30-second attendance token has expired.
          </p>
          <p className="text-xs text-white/75">
            Ask your teacher to display the current active QR screen and scan again.
          </p>
        </div>

        <div className="mt-8 w-full max-w-xs">
          <button
            onClick={onDismiss}
            className="w-full h-12 rounded-xl bg-white text-[#B4483A] font-bold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  // ── SESSION CLOSED ─────────────────────────────────────────────────
  if (result.status === "SESSION_CLOSED") {
    return (
      <div className="fixed inset-0 bg-[#B4483A] z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-[fadeIn_0.2s_ease-out]">
        <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-3xl shadow-xl mb-6">
          🔒
        </div>

        <div className="space-y-3 max-w-sm">
          <h1 className="font-heading text-2xl font-bold">Session Closed</h1>
          <p className="text-sm text-white/90 leading-relaxed">
            Attendance for this lecture has been closed by the faculty.
          </p>
          <p className="text-xs text-white/75">
            If you missed scanning, contact your professor for manual attendance review.
          </p>
        </div>

        <div className="mt-8 w-full max-w-xs">
          <button
            onClick={onDismiss}
            className="w-full h-12 rounded-xl bg-white text-[#B4483A] font-bold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── INVALID QR FORMAT / WRONG CODE ─────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#B4483A] z-50 flex flex-col items-center justify-center p-6 text-white text-center animate-[fadeIn_0.2s_ease-out]">
      <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-3xl shadow-xl mb-6">
        ❌
      </div>

      <div className="space-y-3 max-w-sm">
        <h1 className="font-heading text-2xl font-bold">Invalid QR Code</h1>
        <p className="text-sm text-white/90 leading-relaxed">
          {result.errorMessage || "This QR code is not recognized as a valid ZCOER attendance code."}
        </p>
      </div>

      <div className="mt-8 w-full max-w-xs">
        <button
          onClick={onDismiss}
          className="w-full h-12 rounded-xl bg-white text-[#B4483A] font-bold text-sm shadow-lg hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
        >
          Scan Again
        </button>
      </div>
    </div>
  );
}
