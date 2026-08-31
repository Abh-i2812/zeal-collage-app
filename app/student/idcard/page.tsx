"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";
import { students } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Button } from "@/components/ui/Button";

export default function IDCardPage() {
  const { t } = useLocale();
  const [flipped, setFlipped] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const session = getSession();
  if (!session) return null;
  const student = students.find((s) => s.id === session.id);
  if (!student) return null;

  const initials = student.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // ── "Show to verify" — Fullscreen Gate Security Pass Mode ────────────
  if (verifyMode) {
    return (
      <div
        className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-between p-6 cursor-pointer select-none animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setVerifyMode(false)}
        role="button"
        aria-label="Tap to close"
      >
        <div className="w-full flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/branding/logo.png" alt="Zeal Emblem" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-heading font-bold text-sm text-[#1E2A4A]">ZCOER DIGITAL GATE PASS</p>
              <p className="text-[10px] text-[#33363D]/60">Valid University Security Credential</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#4C7A5E] bg-[#4C7A5E]/10 border border-[#4C7A5E]/20 px-2.5 py-1 rounded-full animate-pulse">
            ● LIVE ACTIVE
          </span>
        </div>

        {/* Large High-Contrast QR Code */}
        <div className="flex flex-col items-center gap-4 text-center my-auto">
          <div className="p-4 bg-white rounded-3xl border-4 border-[#1E2A4A] shadow-2xl">
            <QRCodeSVG prn={student.id} size={240} />
          </div>

          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-bold text-[#1E2A4A]">{student.name}</h2>
            <p className="font-mono text-base font-bold text-[#E8A33D] tracking-widest">{student.id}</p>
            <p className="text-xs text-[#33363D]/70">{student.department} · Year {student.year} (Div {student.division})</p>
          </div>

          <div className="font-mono text-xs text-[#33363D]/60 bg-[#FAF8F4] px-4 py-2 rounded-xl border border-[#33363D]/10">
            Security Timestamp: <span className="font-bold text-[#1E2A4A]">{currentTime}</span>
          </div>
        </div>

        <p className="text-xs text-[#33363D]/50">Tap anywhere on screen to return</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:py-8 flex flex-col items-center gap-6 max-w-xl mx-auto">
      {/* Title */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">{t("id_card_title")}</h1>
          <p className="text-xs text-[#33363D]/60">Official Autonomous Student Identity Card</p>
        </div>
        <span className="text-xs font-semibold text-[#4C7A5E] bg-[#4C7A5E]/10 border border-[#4C7A5E]/20 px-2.5 py-1 rounded-full">
          Verified Active ✓
        </span>
      </div>

      {/* Tap-to-flip helper */}
      <div className="flex items-center gap-1.5 text-xs text-[#33363D]/60 bg-white border border-[#33363D]/15 px-3 py-1 rounded-full shadow-2xs">
        <span>🔄</span>
        <span>{t("tap_to_flip")}</span>
      </div>

      {/* ── 3D Card Flip Box (85.6 : 54 ratio) ────────────────────────── */}
      <div
        className="perspective-1000 w-full max-w-md cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label={flipped ? "Show front" : "Show back"}
      >
        <div
          className="preserve-3d relative transition-transform duration-600 ease-out shadow-2xl rounded-3xl"
          style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            aspectRatio: "85.6 / 54",
          }}
        >
          {/* ════ FRONT SIDE ════════════════════════════════════════════ */}
          <div
            className="backface-hidden absolute inset-0 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between border border-[#33363D]/20"
            style={{
              background: "linear-gradient(145deg, #1E2A4A 0%, #17223D 100%)",
            }}
          >
            {/* Holographic accent stripe */}
            <div className="hologram-foil h-1.5 w-full opacity-70" />

            {/* Top Navy Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/branding/logo.png"
                    alt="Zeal Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-white font-heading font-bold text-xs tracking-wider">ZEAL EDUCATION SOCIETY</p>
                  <p className="text-white/60 text-[9px]">College of Engineering &amp; Research, Pune</p>
                </div>
              </div>

              <span className="text-[9px] font-bold text-[#E8A33D] border border-[#E8A33D]/40 px-1.5 py-0.5 rounded">
                AUTONOMOUS
              </span>
            </div>

            {/* Middle: Photo + Student Credentials */}
            <div className="flex flex-1 items-center gap-4 px-5 py-2">
              {/* Photo Area with Smart Chip */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-18 h-22 rounded-2xl bg-[#263559] border-2 border-[#E8A33D]/60 flex items-center justify-center shadow-inner overflow-hidden">
                  <span className="font-mono text-white text-2xl font-bold">{initials}</span>
                </div>
                {/* Micro Smart Chip */}
                <div className="w-7 h-5 rounded bg-gradient-to-r from-[#D97706] to-[#F59E0B] opacity-80 border border-white/20" />
              </div>

              {/* Identity Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-heading text-white font-bold text-base leading-tight truncate">
                  {student.name}
                </h3>
                
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-[#E8A33D] font-mono font-bold tracking-wide">
                    PRN: {student.id}
                  </p>
                  <p className="text-white/70 font-mono text-[10px]">
                    GR No: {student.grNumber}
                  </p>
                  <p className="text-white/80 font-medium truncate">
                    {student.department}
                  </p>
                  <p className="text-white/60 text-[10px]">
                    Year {student.year} · Division {student.division}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Band */}
            <div className="bg-[#E8A33D] px-5 py-2 flex items-center justify-between text-[#1E2A4A]">
              <span className="text-[10px] font-bold tracking-wide">SPPU AFFILIATED</span>
              <span className="font-mono text-[10px] font-bold">
                {t("valid_till")}: JUN 2027
              </span>
            </div>
          </div>

          {/* ════ BACK SIDE ═════════════════════════════════════════════ */}
          <div
            className="backface-hidden absolute inset-0 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between border border-[#33363D]/20 bg-[#FAF8F4]"
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Magnetic Stripe */}
            <div className="h-9 bg-[#1E2A4A] w-full mt-2" />

            {/* Back info & QR */}
            <div className="flex flex-1 items-center gap-4 px-5 py-3">
              <div className="p-2 bg-white rounded-2xl border border-[#33363D]/15 shadow-sm shrink-0">
                <QRCodeSVG prn={student.id} size={90} />
              </div>

              <div className="flex-1 space-y-1.5 text-xs text-[#1E2A4A]">
                <div>
                  <p className="text-[10px] text-[#33363D]/60 uppercase font-semibold">Blood Group</p>
                  <p className="font-mono text-sm font-bold text-[#B4483A]">{student.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#33363D]/60 uppercase font-semibold">Emergency Guardian</p>
                  <p className="text-[11px] font-medium">{student.guardianName}</p>
                  <p className="font-mono text-[10px] text-[#1E2A4A]">{student.guardianContact}</p>
                </div>
              </div>
            </div>

            {/* Official Disclaimer & Lost & Found */}
            <div className="px-5 pb-3">
              <p className="text-[9px] text-[#33363D]/60 leading-tight border-t border-[#33363D]/12 pt-2 text-center">
                This card is non-transferable property of Zeal College of Engineering &amp; Research, Survey No. 39, Narhe, Pune 411041. Helpline: 020-26930000.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────── */}
      <div className="w-full max-w-md space-y-3">
        <Button
          variant="gold"
          fullWidth
          size="lg"
          onClick={() => setVerifyMode(true)}
        >
          📱 {t("show_to_verify")} (Gate Security Mode)
        </Button>

        <p className="text-xs text-center text-[#33363D]/60">
          Present this digital QR to college security guards at the campus gates for automated entry.
        </p>
      </div>
    </div>
  );
}

/** Minimal inline QR-like SVG encoding the PRN as a visual pattern */
function QRCodeSVG({ prn, size = 80 }: { prn: string; size?: number }) {
  const cells = 21;
  const cellSize = size / cells;

  let seed = 0;
  for (let i = 0; i < prn.length; i++) seed = (seed * 31 + prn.charCodeAt(i)) & 0xffffffff;
  function nextBit() {
    seed = (seed ^ (seed << 13)) & 0xffffffff;
    seed = (seed ^ (seed >> 17)) & 0xffffffff;
    seed = (seed ^ (seed << 5)) & 0xffffffff;
    return (seed & 1) === 0;
  }

  const grid: boolean[][] = Array.from({ length: cells }, () => Array(cells).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  const finder = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,6],[2,0],[2,2],[2,3],[2,4],[2,6],[3,0],[3,2],[3,3],[3,4],[3,6],[4,0],[4,2],[4,3],[4,4],[4,6],[5,0],[5,6],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6]];
  for (const [r, c] of finder) {
    grid[r][c] = true;
    grid[r][cells - 1 - c] = true;
    grid[cells - 1 - r][c] = true;
  }

  // Data cells
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (grid[r][c]) continue;
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= cells - 8) ||
        (r >= cells - 8 && c < 8);
      if (inFinder) continue;
      grid[r][c] = nextBit();
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`QR code for ${prn}`}
      role="img"
    >
      <rect width={size} height={size} fill="white" />
      {grid.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1E2A4A"
            />
          ) : null
        )
      )}
    </svg>
  );
}
