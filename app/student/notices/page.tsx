"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { notices } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import type { Notice } from "@/lib/mockDb";

type Category = "all" | Notice["category"];

const CATEGORIES: { key: Category; labelKey: string }[] = [
  { key: "all",      labelKey: "cat_all" },
  { key: "academic", labelKey: "cat_academic" },
  { key: "events",   labelKey: "cat_events" },
  { key: "fee",      labelKey: "cat_fee" },
  { key: "general",  labelKey: "cat_general" },
];

const CATEGORY_COLORS: Record<Notice["category"], string> = {
  academic: "#1E2A4A",
  events:   "#E8A33D",
  fee:      "#B4483A",
  general:  "#4C7A5E",
};

export default function NoticesPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");

  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<Notice | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (openId) {
      const n = notices.find((x) => x.id === openId);
      if (n) setSelected(n);
    }
  }, [openId]);

  if (!mounted) return <ListSkeleton />;

  const filtered = filter === "all" ? notices : notices.filter((n) => n.category === filter);

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">{t("notices_title")}</h1>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filter notices">
        {CATEGORIES.map(({ key, labelKey }) => (
          <Chip
            key={key}
            label={t(labelKey)}
            active={filter === key}
            onClick={() => setFilter(key)}
          />
        ))}
      </div>

      {/* Notice list */}
      {filtered.length === 0 ? (
        <EmptyState message={t("empty_notices")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => (
            <Card key={notice.id} onClick={() => setSelected(notice)}>
              <div className="flex items-start gap-3">
                {/* Category colour dot */}
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: CATEGORY_COLORS[notice.category] }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E2A4A] line-clamp-2">{notice.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: CATEGORY_COLORS[notice.category] + "18",
                        color: CATEGORY_COLORS[notice.category],
                      }}
                    >
                      {t(`cat_${notice.category}`)}
                    </span>
                    <span className="text-[10px] text-[#33363D]/50">
                      {new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-[10px] text-[#33363D]/50">· {notice.postedBy}</span>
                  </div>
                </div>
                <svg className="shrink-0 text-[#33363D]/30 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Notice detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-[#1E2A4A]/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-[#33363D]/10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
                    style={{
                      background: CATEGORY_COLORS[selected.category] + "18",
                      color: CATEGORY_COLORS[selected.category],
                    }}
                  >
                    {t(`cat_${selected.category}`)}
                  </span>
                  <span className="text-xs text-[#33363D]/50">{selected.postedBy}</span>
                </div>
                <h2 className="font-heading text-lg font-semibold text-[#1E2A4A] leading-tight">{selected.title}</h2>
                <p className="text-xs text-[#33363D]/50 mt-1">
                  {new Date(selected.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#33363D]/60 hover:bg-[#33363D]/5 shrink-0"
                aria-label={t("close")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <p className="text-sm text-[#33363D] leading-relaxed">{selected.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
