"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getSession, logout } from "@/lib/session";
import { useLocale } from "@/lib/locales";
import type { Session } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/admin/students",    label: "Students",     icon: UsersIcon },
  { href: "/admin/classes",     label: "Classes",      icon: BookIcon },
  { href: "/admin/certificates",label: "Certificates", icon: FileIcon },
  { href: "/admin/idcards",     label: "ID Cards",     icon: CardIcon },
  { href: "/admin/notices",     label: "Notices",      icon: BellIcon },
  { href: "/admin/reports",     label: "Reports",      icon: ChartIcon },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang } = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "admin") { router.replace("/"); return; }
    setSession(s);
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  const initials = session?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  function handleLogout() { logout(); router.replace("/"); }

  return (
    <div className="min-h-screen flex bg-[#FAF8F4]">
      {/* ── Sidebar (desktop) / Drawer (mobile) ─────────────────────── */}
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1E2A4A]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={[
          "fixed top-0 left-0 h-full z-50 flex flex-col bg-[#1E2A4A] text-white transition-transform duration-200",
          "w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:h-screen",
        ].join(" ")}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/logo.png"
              alt="Zeal College Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-sm">ZCOER</p>
            <p className="text-[10px] text-white/60 truncate">Admin &amp; Office Portal</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: language + user + logout */}
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          <div className="flex gap-1">
            {(["en", "mr", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={["h-7 px-2 rounded text-xs font-medium", lang === l ? "bg-white text-[#1E2A4A]" : "text-white/50 hover:bg-white/10 hover:text-white"].join(" ")}
              >
                {l === "en" ? "EN" : l === "mr" ? "मर" : "हि"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E8A33D] flex items-center justify-center shrink-0">
              <span className="text-[#1E2A4A] text-xs font-bold font-mono">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{session?.name}</p>
              <p className="text-[10px] text-white/50">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white transition-colors p-1"
              title="Logout"
              aria-label="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile only — just the hamburger) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#33363D]/10 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#33363D]/60 hover:bg-[#33363D]/5"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/logo.png"
              alt="Zeal College Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="font-heading font-semibold text-[#1E2A4A] text-sm">ZCOER Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* Icons */
function UsersIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function BookIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>; }
function FileIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function CardIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function BellIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function ChartIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
