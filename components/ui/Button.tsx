"use client";
import React from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#E8A33D] text-[#1E2A4A] font-bold shadow-sm hover:bg-[#d4922c] active:scale-[0.98] border border-[#d4922c]/40",
  gold:
    "bg-gradient-to-r from-[#E8A33D] to-[#F59E0B] text-[#1E2A4A] font-bold shadow-sm hover:opacity-95 active:scale-[0.98] border border-[#E8A33D]",
  secondary:
    "bg-white text-[#1E2A4A] border border-[#1E2A4A]/25 font-semibold hover:bg-[#1E2A4A]/5 hover:border-[#1E2A4A] active:scale-[0.98]",
  destructive:
    "bg-white text-[#B4483A] border border-[#B4483A]/30 font-semibold hover:bg-[#B4483A]/5 hover:border-[#B4483A] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[#1E2A4A] font-medium hover:bg-[#1E2A4A]/5 active:bg-[#1E2A4A]/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-sm md:text-base rounded-xl font-bold",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-[#E8A33D] focus-visible:outline-offset-2",
        "select-none cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-40 cursor-not-allowed transform-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <Spinner />
          <span className="sr-only">Loading</span>
          <span className="opacity-0 pointer-events-none select-none" aria-hidden>
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
