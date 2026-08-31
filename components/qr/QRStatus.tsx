"use client";
import React from "react";

interface QRStatusProps {
  status: "active" | "closed";
  presentCount: number;
  totalCount: number;
  flaggedCount?: number;
  className?: string;
}

export function QRStatus({
  status,
  presentCount,
  totalCount,
  flaggedCount = 0,
  className = "",
}: QRStatusProps) {
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {status === "active" ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C7A5E]/15 border border-[#4C7A5E]/30 text-xs font-bold text-[#4C7A5E]">
            <span className="w-2 h-2 rounded-full bg-[#4C7A5E] animate-ping" />
            Active Session
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#33363D]/15 border border-[#33363D]/30 text-xs font-bold text-[#33363D]">
            Session Closed
          </span>
        )}

        {flaggedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#B4483A]/15 border border-[#B4483A]/30 text-xs font-bold text-[#B4483A]">
            ⚠️ {flaggedCount} Flagged
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-[#1E2A4A]">
          {presentCount} / {totalCount}
        </span>
        <span className="text-xs text-[#33363D]/60">Present ({percentage}%)</span>
      </div>
    </div>
  );
}
