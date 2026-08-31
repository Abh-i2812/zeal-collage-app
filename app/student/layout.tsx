"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { useLocale } from "@/lib/locales";
import type { Lang } from "@/lib/locales";
import type { Session } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/student",            labelKey: "nav_home",       icon: HomeIcon },
  { href: "/student/attendance", labelKey: "nav_attendance", icon: CalendarIcon },
  { href: "/student/rankings",   labelKey: "nav_rankings",   icon: TrophyIcon, badge: "#4" },
  { href: "/student/marks",      labelKey: "nav_marks",      icon: BarChartIcon },
  { href: "/student/documents",  labelKey: "nav_documents",  icon: FileIcon },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "student") {
      router.replace("/");
      return;
    }
    setSession(s);
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const initials = session?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "ST";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
      {/* ── Top Glass Navigation Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#33363D]/10 h-16 flex items-center px-4 md:px-6 gap-3 transition-all">
        {/* Brand Logo & Name */}
        <Link href="/student" className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-90 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Zeal College Logo"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-sm"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-heading font-bold text-[#1E2A4A] text-base tracking-tight flex items-center gap-1.5">
              ZCOER
              <span className="text-[10px] font-sans font-semibold bg-[#4C7A5E]/15 text-[#4C7A5E] px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                STUDENT
              </span>
            </span>
            <span className="text-[10px] text-[#33363D]/60 truncate hidden sm:block">
              Zeal College of Engineering &amp; Research
            </span>
          </div>
        </Link>

        {/* Quick Rank Button in Top Bar */}
        <Link
          href="/student/rankings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8A33D]/15 border border-[#E8A33D]/30 hover:bg-[#E8A33D]/25 transition-all cursor-pointer shadow-sm active:scale-95"
          title="View Class Rankings"
        >
          <span className="text-sm">🏆</span>
          <span className="font-heading font-bold text-xs text-[#1E2A4A]">Rank #4</span>
        </Link>

        {/* Language selector toggle */}
        <div className="flex gap-1 bg-[#FAF8F4] p-0.5 rounded-lg border border-[#33363D]/10">
          {(["en", "mr", "hi"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                "h-7 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                lang === l
                  ? "bg-[#1E2A4A] text-white shadow-xs"
                  : "text-[#33363D]/70 hover:text-[#1E2A4A] hover:bg-[#33363D]/5",
              ].join(" ")}
            >
              {l === "en" ? "EN" : l === "mr" ? "मर" : "हि"}
            </button>
          ))}
        </div>

        {/* Avatar → Profile Link */}
        <Link
          href="/student/profile"
          className="relative w-10 h-10 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[#E8A33D] transition-all shadow-sm"
          aria-label="Student Profile"
        >
          <span className="text-white text-xs font-bold font-mono">{initials}</span>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4C7A5E] border-2 border-white" />
        </Link>
      </header>

      {/* ── Main Page Content ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto pb-24 md:pb-12">
        {children}
      </main>

      {/* ── Creative Bottom Tab Bar (Mobile) ───────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#33363D]/10 h-16 flex items-stretch md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
        aria-label="Student navigation"
      >
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon, badge }) => {
          const active =
            href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
                "transition-all min-h-[44px] relative",
                active
                  ? "text-[#1E2A4A]"
                  : "text-[#33363D]/50 hover:text-[#33363D]/80",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 w-8 h-1 rounded-b-full bg-[#E8A33D]" />
              )}
              <div className="relative">
                <Icon active={active} />
                {badge && !active && (
                  <span className="absolute -top-1 -right-2 text-[8px] font-bold bg-[#E8A33D] text-[#1E2A4A] px-1 rounded-full leading-none py-0.5">
                    {badge}
                  </span>
                )}
              </div>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ── SVG Icons ──────────────────────────────────────────────────────── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#1E2A4A" : "none"} stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#1E2A4A" : "none"} stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
    </svg>
  );
}

function BarChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function FileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
