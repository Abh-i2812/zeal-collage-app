"use client";
import { useState, useEffect } from "react";

interface QRCountdownProps {
  expiresAt: number; // Unix timestamp in seconds
  onExpire: () => void;
  className?: string;
}

export function QRCountdown({ expiresAt, onExpire, className = "" }: QRCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  useEffect(() => {
    const calculateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, expiresAt - now);
      setSecondsLeft(diff);

      if (diff <= 0) {
        onExpire();
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formattedTime = `00:${String(secondsLeft).padStart(2, "0")}`;
  const percent = Math.min(100, Math.max(0, (secondsLeft / 30) * 100));

  return (
    <div className={`space-y-1.5 w-full max-w-xs ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#33363D]/60 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E8A33D]" />
          QR rotates in
        </span>
        <span className="font-bold text-[#E8A33D] text-sm">{formattedTime}</span>
      </div>

      <div className="h-2 w-full bg-[#33363D]/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${percent}%`,
            backgroundColor: secondsLeft < 6 ? "#B4483A" : "#E8A33D",
          }}
        />
      </div>
    </div>
  );
}
