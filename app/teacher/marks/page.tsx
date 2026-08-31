"use client";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLocale } from "@/lib/locales";

export default function TeacherMarksPage() {
  const { t } = useLocale();
  return (
    <div className="px-4 py-5">
      <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A] mb-4">{t("marks_title")}</h1>
      <EmptyState message={t("coming_soon")} />
    </div>
  );
}
