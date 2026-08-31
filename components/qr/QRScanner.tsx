"use client";
import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getAllActiveSessions } from "@/lib/qr/qrStorage";
import { getCurrentQRPayload } from "@/lib/qr/qrSession";
import { AttendanceSession } from "@/lib/qr/qrTypes";
import { Button } from "@/components/ui/Button";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  className?: string;
}

export function QRScanner({ onScan, className = "" }: QRScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Play audio beep on successful detection
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext fallback
    }
  };

  // Initialize camera scanner
  useEffect(() => {
    let mounted = true;
    const elementId = "zcoer-qr-camera-element";

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;
            playBeep();
            onScan(decodedText);
          },
          () => {
            // Frame parse error — ignore
          }
        );

        if (mounted) {
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: unknown) {
        console.warn("Camera init failed, using demo fallback:", err);
        if (mounted) {
          setCameraActive(false);
          const msg = (err as Error)?.message || "Camera access denied or unavailable.";
          setCameraError(msg);
          // Default to demo mode if camera is unavailable
          setDemoMode(true);
        }
      }
    };

    startScanner();

    // Load active sessions for demo mode
    const sessions = getAllActiveSessions();
    setActiveSessions(sessions);
    if (sessions.length > 0) {
      setSelectedSessionId(sessions[0].sessionId);
    }

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try {
          // Check scanner state before stopping (2 = SCANNING, 3 = PAUSED)
          const state = (scannerRef.current as unknown as { getState?: () => number }).getState?.();
          if (state === 2 || state === 3) {
            scannerRef.current
              .stop()
              .catch(() => {})
              .finally(() => {
                try {
                  scannerRef.current?.clear();
                } catch {}
              });
          } else {
            try {
              scannerRef.current.clear();
            } catch {}
          }
        } catch {
          // Ignore scanner stop errors
        }
      }
    };
  }, [onScan]);

  // Demo scan execution
  function handleDemoScan(scenario: "active" | "expired" | "invalid") {
    playBeep();

    if (scenario === "invalid") {
      onScan("INVALID_NON_ZCOER_QR_CODE_DATA");
      return;
    }

    // Find selected or default session
    let targetSession = activeSessions.find((s) => s.sessionId === selectedSessionId);
    
    // If no stored active session exists, synthesize a live demo session
    if (!targetSession) {
      const now = Math.floor(Date.now() / 1000);
      targetSession = {
        sessionId: "SES-DEMO-LIVE",
        subjectId: "SUB001",
        subject: "DBMS (Database Systems)",
        teacherId: "TCH001",
        room: "Room 304",
        createdAt: now - 120,
        expiresAt: now + 3600,
        status: "active",
        activeTokenCreatedAt: now - 5,
        activeTokenExpiresAt: now + 25,
        tokenIndex: 1,
        attendance: [],
      };
    }

    const payload = getCurrentQRPayload(targetSession);

    if (scenario === "expired") {
      payload.createdAt = Math.floor(Date.now() / 1000) - 90;
      payload.expiresAt = Math.floor(Date.now() / 1000) - 60; // Expired 1 min ago
    }

    onScan(JSON.stringify(payload));
  }

  return (
    <div className={`flex flex-col items-center gap-4 w-full ${className}`}>
      {/* ── Camera Scanner Viewport ─────────────────────────────────── */}
      <div className="relative w-full max-w-sm aspect-square bg-[#131C33] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 flex items-center justify-center">
        {/* html5-qrcode target div */}
        <div id="zcoer-qr-camera-element" className="w-full h-full object-cover" />

        {/* Viewfinder Target Overlays */}
        {cameraActive && !demoMode && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Animated Laser Beam */}
            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent shadow-[0_0_12px_#E8A33D] animate-laser" />

            {/* Targeting reticle */}
            <div className="w-56 h-56 rounded-3xl border-2 border-[#E8A33D]/60 relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#E8A33D] -mt-1 -ml-1 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#E8A33D] -mt-1 -mr-1 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#E8A33D] -mb-1 -ml-1 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#E8A33D] -mb-1 -mr-1 rounded-br-xl" />
            </div>
          </div>
        )}

        {/* Camera Error / Fallback UI */}
        {(!cameraActive || demoMode) && (
          <div className="absolute inset-0 bg-[#1E2A4A] p-6 flex flex-col items-center justify-center text-center text-white space-y-3 z-10">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl">
              📹
            </div>
            <div>
              <p className="font-heading font-bold text-base">
                {cameraError ? "Camera Access Required" : "Demo Scanner Mode"}
              </p>
              <p className="text-xs text-white/70 mt-1 max-w-xs leading-relaxed">
                {cameraError
                  ? "Camera permission is disabled or unavailable. Use the demo scanner below for your college presentation."
                  : "Scanning live simulated teacher session payloads."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mode Switcher & Fallback Demo Controls ───────────────────── */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDemoMode((v) => !v)}
            className="text-xs font-semibold text-[#E8A33D] underline cursor-pointer hover:text-white transition-colors"
          >
            {demoMode ? "← Try Physical Camera" : "⚡ Switch to Demo Scanner"}
          </button>
        </div>

        {/* Demo Scanner Panel */}
        {demoMode && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Select Active Teacher Lecture</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-white/20 bg-[#1E2A4A] text-white text-xs font-medium focus:outline-none focus:border-[#E8A33D]"
              >
                {activeSessions.length > 0 ? (
                  activeSessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.subject} · {s.room} (Session #{s.sessionId.slice(-6)})
                    </option>
                  ))
                ) : (
                  <option value="SES-DEMO-LIVE">DBMS · Room 304 (Live Demo)</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDemoScan("active")}
                className="py-2.5 px-2 rounded-xl bg-[#4C7A5E] hover:bg-[#4C7A5E]/90 text-white font-bold text-xs shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                ✓ Valid QR
              </button>

              <button
                type="button"
                onClick={() => handleDemoScan("expired")}
                className="py-2.5 px-2 rounded-xl bg-[#B4483A] hover:bg-[#B4483A]/90 text-white font-bold text-xs shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                ⏱ Expired
              </button>

              <button
                type="button"
                onClick={() => handleDemoScan("invalid")}
                className="py-2.5 px-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                ❌ Bad Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
