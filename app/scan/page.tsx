"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface ScanResponse {
  success: boolean;
  status: "present" | "late" | "flagged" | "rejected" | "already_marked";
  reasonCode?: string;
  message?: string;
  distanceM?: number;
  trustScore?: number;
  deviceMatch?: boolean;
  rejectReason?: string;
}

interface GpsState {
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  status: "idle" | "acquiring" | "acquired" | "failed";
  errorMsg: string | null;
}

export default function StudentScanPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResponse | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("72201234M");

  // GPS state with real accuracy tracking
  const [gps, setGps] = useState<GpsState>({
    latitude: null,
    longitude: null,
    accuracyM: null,
    status: "idle",
    errorMsg: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isVerifyingRef = useRef(false);
  const gpsWatchRef = useRef<number | null>(null);

  // ── Init device ID and student ID from localStorage ────────────────
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      // Device ID (persistent)
      let id = localStorage.getItem("registered_device_id");
      if (!id) {
        id = "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now();
        localStorage.setItem("registered_device_id", id);
      }
      setDeviceId(id);

      // Student ID from session
      const stored = localStorage.getItem("student_id") || sessionStorage.getItem("student_id");
      if (stored) setStudentId(stored);
    }
  }, []);

  // ── GPS: use watchPosition for continuous high-accuracy tracking ────
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGps((prev) => ({ ...prev, status: "failed", errorMsg: "Geolocation not supported by this browser." }));
      return;
    }

    setGps((prev) => ({ ...prev, status: "acquiring" }));

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGps({
          latitude,
          longitude,
          accuracyM: Math.round(accuracy),
          status: "acquired",
          errorMsg: null,
        });
      },
      (err) => {
        console.warn("GPS error:", err.code, err.message);
        let msg = "Location unavailable.";
        if (err.code === 1) msg = "Location permission denied. Please allow in browser settings.";
        if (err.code === 2) msg = "GPS signal unavailable. Try moving near a window.";
        if (err.code === 3) msg = "GPS timed out. Retrying…";
        setGps((prev) => ({
          ...prev,
          status: "failed",
          errorMsg: msg,
        }));
      },
      {
        enableHighAccuracy: true,  // Force GPS hardware (not cell/wifi)
        timeout: 15000,
        maximumAge: 5000,          // Cache up to 5s (not 0, avoids battery drain)
      }
    );

    return () => {
      if (gpsWatchRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  // ── Start Camera ────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setLastResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(tickDecode);
      }
    } catch (err: unknown) {
      console.error("Camera error:", err);
      setCameraError("Camera permission required. Allow camera access in browser settings (Settings → Site permissions → Camera → Allow).");
      setCameraActive(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop Camera ─────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── QR Decode Loop ──────────────────────────────────────────────────
  const tickDecode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas && !isVerifyingRef.current) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) {
          handleQRCodeDetected(code.data);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tickDecode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit QR to API ────────────────────────────────────────────────
  const handleQRCodeDetected = async (qrText: string) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    // Block if GPS accuracy is too poor
    if (gps.status === "acquired" && gps.accuracyM !== null && gps.accuracyM > 100) {
      showToast(`⚠️ GPS accuracy is ±${gps.accuracyM}m — too poor for verification. Move outdoors or near a window.`, "error");
      setTimeout(() => { isVerifyingRef.current = false; }, 4000);
      return;
    }

    // Block if GPS not acquired at all
    if (gps.status === "failed" || (gps.status !== "acquired" && !gps.latitude)) {
      showToast("⚠️ GPS location required. Please enable Location for this page.", "error");
      setTimeout(() => { isVerifyingRef.current = false; }, 4000);
      return;
    }

    try {
      let parsedToken: Record<string, unknown> = {};
      try {
        parsedToken = JSON.parse(qrText);
      } catch {
        parsedToken = { sessionId: "SES-DEMO", token: qrText };
      }

      showToast("🔍 Verifying QR + GPS geofence…", "info");

      const res = await fetch("/api/verify-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: (parsedToken.sessionId as string) || "SES-DEMO",
          signedToken: parsedToken,
          token: (parsedToken.token as string) || qrText,
          studentId,
          deviceId,
          latitude: gps.latitude,
          longitude: gps.longitude,
          gpsAccuracyM: gps.accuracyM || 20,
        }),
      });

      const data: ScanResponse = await res.json();
      setLastResult(data);

      if (data.success) {
        if (data.status === "already_marked") {
          showToast("ℹ️ Attendance already recorded for this session.", "info");
        } else if (data.status === "flagged") {
          showToast("⚠️ Marked — Flagged for teacher review.", "info");
          stopCamera();
        } else {
          showToast(`✓ ${data.status === "late" ? "Marked LATE" : "Marked PRESENT"} — ${data.distanceM?.toFixed(0)}m from class`, "success");
          stopCamera();
        }
      } else {
        showToast(`❌ ${data.message || data.rejectReason || "Verification failed"}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setTimeout(() => {
        isVerifyingRef.current = false;
        if (cameraActive && animationFrameRef.current === null) {
          animationFrameRef.current = requestAnimationFrame(tickDecode);
        }
      }, 3000);
    }
  };

  if (!mounted) return null;

  const gpsAccuracyColor =
    gps.status === "acquired"
      ? gps.accuracyM !== null && gps.accuracyM <= 30
        ? "#4C7A5E"  // Green — excellent
        : gps.accuracyM !== null && gps.accuracyM <= 100
        ? "#E8A33D"  // Amber — OK
        : "#B4483A"  // Red — too poor
      : gps.status === "acquiring"
      ? "#E8A33D"
      : "#B4483A";

  const gpsLabel =
    gps.status === "acquiring"
      ? "Acquiring GPS…"
      : gps.status === "failed"
      ? "GPS failed"
      : gps.accuracyM !== null
      ? `±${gps.accuracyM}m`
      : "GPS ready";

  const canScan = gps.status === "acquired" && (gps.accuracyM === null || gps.accuracyM <= 100);

  return (
    <div className="min-h-screen bg-[#131C33] text-white flex flex-col max-w-lg mx-auto">
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/10">
        <Link
          href="/student"
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          ✕
        </Link>
        <div className="text-center">
          <p className="font-heading font-bold text-base text-white">Student QR Scanner</p>
          <p className="text-[11px] text-white/50">ZCOER Anti-Proxy Geofenced Check-In</p>
        </div>
        {/* Live GPS Accuracy Indicator */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: gpsAccuracyColor, boxShadow: `0 0 6px ${gpsAccuracyColor}` }}
          />
          <span className="text-[9px] font-mono" style={{ color: gpsAccuracyColor }}>
            {gpsLabel}
          </span>
        </div>
      </div>

      {/* GPS Status Banner */}
      {gps.status === "failed" && (
        <div className="mx-4 mt-3 bg-[#B4483A]/20 border border-[#B4483A]/40 rounded-2xl p-3 text-xs text-center space-y-1">
          <p className="font-bold text-[#FFC7CE]">⚠️ GPS Location Required</p>
          <p className="text-white/70">{gps.errorMsg}</p>
        </div>
      )}

      {gps.status === "acquired" && gps.accuracyM !== null && gps.accuracyM > 100 && (
        <div className="mx-4 mt-3 bg-[#E8A33D]/20 border border-[#E8A33D]/40 rounded-2xl p-3 text-xs text-center space-y-1">
          <p className="font-bold text-[#FFEB9C]">⚠️ GPS Accuracy Too Low (±{gps.accuracyM}m)</p>
          <p className="text-white/70">
            Move outdoors or near a window to improve accuracy. Need ≤100m for verification.
          </p>
        </div>
      )}

      {gps.status === "acquiring" && (
        <div className="mx-4 mt-3 bg-[#E8A33D]/10 border border-[#E8A33D]/20 rounded-2xl p-3 text-xs text-center">
          <p className="text-[#E8A33D] animate-pulse font-semibold">📡 Acquiring GPS signal…</p>
        </div>
      )}

      {/* Camera Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 space-y-4">
        <div className="relative w-full max-w-xs aspect-square bg-[#1E2A4A] rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl flex items-center justify-center">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            playsInline
            muted
          />

          {/* Viewfinder Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent shadow-[0_0_12px_#E8A33D] animate-laser" />
              <div className="w-48 h-48 rounded-2xl border-2 border-[#E8A33D]/60 relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#E8A33D] -mt-1 -ml-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#E8A33D] -mt-1 -mr-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#E8A33D] -mb-1 -ml-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#E8A33D] -mb-1 -mr-1 rounded-br-xl" />
              </div>
            </div>
          )}

          {/* Offline / Error State */}
          {!cameraActive && (
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl mx-auto">
                📷
              </div>
              <p className="text-sm font-bold">Camera Offline</p>
              <p className="text-xs text-white/60 leading-relaxed">
                {cameraError || "Tap below to activate camera"}
              </p>
            </div>
          )}
        </div>

        {/* GPS Location Display */}
        {gps.status === "acquired" && gps.latitude && (
          <div className="w-full max-w-xs bg-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs border border-white/10">
            <div className="flex items-center gap-2">
              <span style={{ color: gpsAccuracyColor }}>📍</span>
              <span className="font-mono text-white/80">
                {gps.latitude.toFixed(5)}°, {gps.longitude!.toFixed(5)}°
              </span>
            </div>
            <span className="font-bold font-mono" style={{ color: gpsAccuracyColor }}>
              ±{gps.accuracyM}m
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="w-full max-w-xs space-y-3">
          {!cameraActive ? (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={startCamera}
              disabled={!canScan && gps.status !== "idle"}
            >
              {gps.status === "acquiring"
                ? "⏳ Waiting for GPS…"
                : !canScan && gps.status === "acquired"
                ? `⚠️ GPS too inaccurate (±${gps.accuracyM}m)`
                : "📷 Open Camera & Scan QR"}
            </Button>
          ) : (
            <Button variant="secondary" fullWidth size="md" onClick={stopCamera}>
              Stop Camera
            </Button>
          )}

          {/* Scan Result */}
          {lastResult && (
            <div
              className={[
                "p-4 rounded-2xl border text-center space-y-1.5 animate-[fadeIn_0.2s_ease-out]",
                lastResult.success
                  ? lastResult.status === "flagged"
                    ? "bg-[#FCE4D6]/30 border-[#E8A33D]/50"
                    : "bg-[#4C7A5E]/30 border-[#4C7A5E]/50"
                  : "bg-[#B4483A]/30 border-[#B4483A]/50",
              ].join(" ")}
            >
              <p className="text-base font-bold">
                {lastResult.success
                  ? lastResult.status === "flagged"
                    ? "⚠️ FLAGGED"
                    : lastResult.status === "late"
                    ? "⏱ LATE"
                    : lastResult.status === "already_marked"
                    ? "ℹ️ ALREADY MARKED"
                    : "✓ PRESENT"
                  : "❌ REJECTED"}
              </p>
              <p className="text-xs text-white/80">
                {lastResult.message || lastResult.rejectReason || ""}
              </p>
              {lastResult.distanceM !== undefined && lastResult.distanceM > 0 && (
                <p className="text-xs font-mono text-white/60">
                  {lastResult.distanceM.toFixed(0)}m from classroom · Trust: {lastResult.trustScore ?? "—"}/100
                </p>
              )}
            </div>
          )}

          {/* Device & Session Info Footer */}
          <div className="text-center text-[10px] text-white/35 space-y-0.5 pt-1">
            <p>Device: <span className="font-mono">{deviceId.slice(0, 18)}…</span></p>
            <p>Student ID: <span className="font-mono">{studentId}</span></p>
            <p>GPS: {gps.status} {gps.accuracyM !== null ? `· ±${gps.accuracyM}m accuracy` : ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
