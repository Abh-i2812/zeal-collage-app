"use client";
import React from "react";

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, active = false, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center h-9 px-3 rounded-full text-sm font-medium",
        "border transition-colors select-none cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-[#E8A33D] focus-visible:outline-offset-1",
        active
          ? "bg-[#E8A33D] border-[#E8A33D] text-[#1E2A4A]"
          : "bg-white border-[#33363D]/25 text-[#33363D] hover:border-[#33363D]/50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}
