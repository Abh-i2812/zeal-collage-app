"use client";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export function Card({ children, className = "", onClick, hoverEffect = true }: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={[
        "bg-white rounded-2xl border border-[#33363D]/12 p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]",
        onClick
          ? "cursor-pointer text-left w-full hover:border-[#1E2A4A]/30 hover:shadow-[0_4px_12px_rgba(30,42,74,0.06)] active:scale-[0.99] transition-all duration-150"
          : hoverEffect
          ? "transition-all duration-150"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
