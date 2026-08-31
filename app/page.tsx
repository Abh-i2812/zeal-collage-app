"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/session";
import { useLocale } from "@/lib/locales";
import type { Lang } from "@/lib/locales";

const MAX_ATTEMPTS = 5;

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLocale();

  const [tab, setTab] = useState<"student" | "staff">("student");
  const [idValue, setIdValue] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(MAX_ATTEMPTS);

  function executeLogin(id: string, pass: string) {
    if (loading) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const session = login(id, pass);
      if (session) {
        if (session.role === "student") router.push("/student");
        else if (session.role === "teacher") router.push("/teacher");
        else router.push("/admin/students");
      } else {
        attemptsRef.current = Math.max(0, attemptsRef.current - 1);
        const left = attemptsRef.current;
        setError(`${t("login_error")} ${left} ${t("attempts_left")}.`);
        setLoading(false);
      }
    }, 450);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeLogin(idValue, password);
  }

  // Quick One-Tap Demo Login
  function quickDemoLogin(id: string, roleTab: "student" | "staff") {
    setTab(roleTab);
    setIdValue(id);
    setPassword("12345");
    executeLogin(id, "12345");
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F4] relative overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Zeal College Emblem"
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
          <div className="hidden sm:block">
            <p className="font-heading font-bold text-[#1E2A4A] text-sm leading-none">ZCOER</p>
            <p className="text-[10px] text-[#33363D]/60 mt-0.5">Zeal Education Society · Estd. 1996</p>
          </div>
        </div>

        {/* Language selector chips */}
        <div className="flex items-center gap-1 bg-white border border-[#33363D]/15 rounded-full p-1 shadow-sm">
          {(["en", "mr", "hi"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                "h-7 px-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                lang === l
                  ? "bg-[#1E2A4A] text-white shadow-sm"
                  : "text-[#33363D]/70 hover:text-[#1E2A4A] hover:bg-[#33363D]/5",
              ].join(" ")}
            >
              {l === "en" ? "English" : l === "mr" ? "मराठी" : "हिंदी"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main Login Card ─────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#33363D]/15 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          {/* Emblem & College Identity */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 flex items-center justify-center p-1 bg-[#FAF8F4] rounded-2xl border border-[#33363D]/10 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/logo.png"
                alt="Zeal Education Society"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-[#1E2A4A] tracking-tight">
                {t("app_tagline")}
              </h1>
              <p className="text-xs text-[#33363D]/60 mt-1">
                {t("app_affiliated")} · <span className="text-[#4C7A5E] font-medium">NAAC &apos;A&apos; Grade</span>
              </p>
            </div>
          </div>

          {/* Student / Staff Segmented Toggle */}
          <div className="flex bg-[#FAF8F4] p-1 rounded-xl border border-[#33363D]/10">
            {(["student", "staff"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setTab(role);
                  setError(null);
                  setIdValue("");
                  setPassword("");
                }}
                className={[
                  "flex-1 h-10 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  tab === role
                    ? "bg-[#1E2A4A] text-white shadow-sm"
                    : "text-[#33363D]/70 hover:text-[#1E2A4A]",
                ].join(" ")}
              >
                <span>{role === "student" ? "🎓" : "💼"}</span>
                <span>{t(role)}</span>
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label={tab === "student" ? t("prn_label") : t("emp_label")}
              helper={tab === "student" ? t("prn_helper") : undefined}
              placeholder={tab === "student" ? "e.g. 72201234M" : "e.g. TCH001 or EMP001"}
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
              autoComplete="username"
              mono
              required
            />
            <Input
              label={t("password_label")}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {/* Error strip */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#B4483A]/10 border border-[#B4483A]/20 animate-[shake_0.4s_ease-in-out]"
              >
                <AlertIcon />
                <p className="text-xs font-medium text-[#B4483A] leading-snug">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
              className="mt-2"
            >
              {t("login")} ➔
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                className="text-xs font-medium text-[#1E2A4A] underline underline-offset-4 hover:text-[#E8A33D] transition-colors"
              >
                {t("forgot_password")}
              </button>
            </div>
          </form>

          {/* One-Tap Demo Access Box */}
          <div className="rounded-2xl bg-[#FAF8F4] border border-[#33363D]/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E2A4A]">
                ⚡ One-Tap Demo Accounts
              </p>
              <span className="text-[10px] text-[#4C7A5E] font-medium font-mono">pass: 12345</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => quickDemoLogin("72201234M", "student")}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-[#33363D]/15 hover:border-[#E8A33D] hover:bg-[#E8A33D]/5 transition-all text-center cursor-pointer"
              >
                <span className="text-base">🎓</span>
                <span className="text-[11px] font-bold text-[#1E2A4A]">Student</span>
                <span className="font-mono text-[9px] text-[#33363D]/60">Aarav</span>
              </button>

              <button
                type="button"
                onClick={() => quickDemoLogin("TCH001", "staff")}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-[#33363D]/15 hover:border-[#E8A33D] hover:bg-[#E8A33D]/5 transition-all text-center cursor-pointer"
              >
                <span className="text-base">👩‍🏫</span>
                <span className="text-[11px] font-bold text-[#1E2A4A]">Teacher</span>
                <span className="font-mono text-[9px] text-[#33363D]/60">Dr. Meera</span>
              </button>

              <button
                type="button"
                onClick={() => quickDemoLogin("EMP001", "staff")}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-[#33363D]/15 hover:border-[#E8A33D] hover:bg-[#E8A33D]/5 transition-all text-center cursor-pointer"
              >
                <span className="text-base">🏢</span>
                <span className="text-[11px] font-bold text-[#1E2A4A]">Admin</span>
                <span className="font-mono text-[9px] text-[#33363D]/60">Kavita</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full text-center py-4 text-[11px] text-[#33363D]/50 z-10 border-t border-[#33363D]/8">
        Zeal College of Engineering and Research, Narhe, Pune – 411041 · Autonomous System
      </footer>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4483A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
