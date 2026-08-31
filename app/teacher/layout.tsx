"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getSession, logout } from "@/lib/session";
import { useLocale } from "@/lib/locales";
import type { Session } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/teacher",             labelKey: "nav_today",      icon: TodayIcon },
  { href: "/teacher/session",     labelKey: "nav_attendance", icon: CheckIcon },
  { href: "/teacher/marks",       labelKey: "nav_marks",      icon: BarIcon },
  { href: "/teacher/leaves",      labelKey: "nav_leaves",     icon: CalIcon },
  { href: "/teacher/notices",     labelKey: "nav_notices",    icon: BellIcon },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "teacher") { router.replace("/"); return; }
    setSession(s);
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const initials = session?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "TC";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#33363D]/10 h-14 flex items-center px-4 gap-3">
        <Link href="/teacher" className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-90 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Zeal College Logo"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-heading font-bold text-[#1E2A4A] text-sm tracking-tight">
              ZCOER
            </span>
            <span className="text-[10px] text-[#33363D]/60 truncate hidden sm:block">
              Teacher &amp; Faculty Portal
            </span>
          </div>
        </Link>
        <div className="flex gap-1">
          {(["en", "mr", "hi"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={["h-7 px-2 rounded text-xs font-medium transition-colors", lang === l ? "bg-[#1E2A4A] text-white" : "text-[#33363D]/70 hover:bg-[#33363D]/10"].join(" ")}>
              {l === "en" ? "EN" : l === "mr" ? "मर" : "हि"}
            </button>
          ))}
        </div>
        <button onClick={() => { logout(); router.replace("/"); }}
          className="w-9 h-9 rounded-full bg-[#E8A33D] flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Logout"
          title={session?.name}
        >
          <span className="text-[#1E2A4A] text-xs font-bold font-mono">{initials}</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#33363D]/10 h-16 flex items-stretch" aria-label="Teacher navigation">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = href === "/teacher" ? pathname === "/teacher" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={["flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px]", active ? "text-[#1E2A4A]" : "text-[#33363D]/50 hover:text-[#33363D]/80"].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon active={active} />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/></svg>;
}
function CheckIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>;
}
function BarIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function CalIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function BellIcon({ active }: { active: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#1E2A4A" : "none"} stroke={active ? "#1E2A4A" : "#33363D80"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
