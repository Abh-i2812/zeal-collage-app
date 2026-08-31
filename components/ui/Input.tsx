"use client";
import React, { useState, useId } from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label?: string;
  helper?: string;
  error?: string;
  mono?: boolean; // IBM Plex Mono for ID fields
}

export function Input({
  label,
  helper,
  error,
  mono = false,
  className = "",
  type,
  ...props
}: InputProps) {
  const id = useId();
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1E2A4A]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={id}
          type={inputType}
          className={[
            "w-full h-11 px-3 rounded-lg border bg-white text-[#1E2A4A] text-sm",
            "placeholder:text-[#33363D]/40",
            "focus:outline-none focus:border-[#1E2A4A]",
            "transition-colors",
            mono ? "font-mono tracking-wide" : "",
            error
              ? "border-[#B4483A] focus:border-[#B4483A]"
              : "border-[#33363D]/25",
            isPassword ? "pr-11" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-[#33363D]/60 hover:text-[#1E2A4A] transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPw ? <EyeOff /> : <EyeOn />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[#B4483A]">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[#33363D]/60">{helper}</p>
      ) : null}
    </div>
  );
}

function EyeOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
