"use client";
import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ message, actionLabel, onAction, className = "" }: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-3 p-8 rounded-lg",
        "border-2 border-dashed border-[#33363D]/15 text-center",
        className,
      ].join(" ")}
    >
      <p className="text-sm text-[#33363D]/60">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
