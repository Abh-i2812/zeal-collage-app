"use client";
import React from "react";

type Status = "active" | "graduated" | "left" | "blocked" | "pending" | "verified" | "processing" | "ready";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
  dot?: boolean;
}

const config: Record<Status, { bg: string; text: string; border: string; dotColor: string; defaultLabel: string }> = {
  active:      { bg: "bg-[#4C7A5E]/12", text: "text-[#4C7A5E]", border: "border-[#4C7A5E]/25", dotColor: "bg-[#4C7A5E]", defaultLabel: "Active" },
  verified:    { bg: "bg-[#4C7A5E]/12", text: "text-[#4C7A5E]", border: "border-[#4C7A5E]/25", dotColor: "bg-[#4C7A5E]", defaultLabel: "Verified" },
  ready:       { bg: "bg-[#4C7A5E]/12", text: "text-[#4C7A5E]", border: "border-[#4C7A5E]/25", dotColor: "bg-[#4C7A5E]", defaultLabel: "Ready" },
  graduated:   { bg: "bg-[#33363D]/10", text: "text-[#33363D]", border: "border-[#33363D]/20", dotColor: "bg-[#33363D]", defaultLabel: "Graduated" },
  left:        { bg: "bg-[#B4483A]/12", text: "text-[#B4483A]", border: "border-[#B4483A]/25", dotColor: "bg-[#B4483A]", defaultLabel: "Left" },
  blocked:     { bg: "bg-[#B4483A]/12", text: "text-[#B4483A]", border: "border-[#B4483A]/25", dotColor: "bg-[#B4483A]", defaultLabel: "Blocked" },
  pending:     { bg: "bg-[#E8A33D]/15", text: "text-[#B47414]", border: "border-[#E8A33D]/30", dotColor: "bg-[#E8A33D]", defaultLabel: "Pending" },
  processing:  { bg: "bg-[#E8A33D]/15", text: "text-[#B47414]", border: "border-[#E8A33D]/30", dotColor: "bg-[#E8A33D]", defaultLabel: "Processing" },
};

export function StatusBadge({ status, label, className = "", dot = true }: StatusBadgeProps) {
  const { bg, text, border, dotColor, defaultLabel } = config[status] ?? config.pending;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-tight",
        bg, text, border, className,
      ].join(" ")}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden />}
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
