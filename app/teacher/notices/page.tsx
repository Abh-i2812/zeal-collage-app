"use client";
import { useState, useEffect } from "react";
import { notices } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";

export default function TeacherNoticesPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">{t("notices_title")}</h1>
      <div className="space-y-3">
        {notices.map((n) => (
          <Card key={n.id} className="space-y-1">
            <p className="text-sm font-semibold text-[#1E2A4A] line-clamp-2">{n.title}</p>
            <p className="text-xs text-[#33363D]/50">
              {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {n.postedBy}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
