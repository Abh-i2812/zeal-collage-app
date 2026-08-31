"use client";
import React, { useEffect, useRef } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trap scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E2A4A]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel — full screen mobile, right panel md+ */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          "relative ml-auto flex flex-col bg-white shadow-xl",
          "w-full md:max-w-md h-full",
          "animate-[slideInRight_200ms_ease-out]",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#33363D]/10">
          {title && (
            <h2 className="font-heading text-lg font-semibold text-[#1E2A4A]">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center w-11 h-11 rounded-lg text-[#33363D]/60 hover:text-[#1E2A4A] hover:bg-[#33363D]/5 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
