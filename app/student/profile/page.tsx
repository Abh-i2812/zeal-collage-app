"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, logout } from "@/lib/session";
import { students } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function StudentProfile() {
  const router = useRouter();
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <ListSkeleton />;

  const session = getSession();
  if (!session) return null;
  const student = students.find((s) => s.id === session.id);
  if (!student) return null;

  const initials = student.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  function handleLogout() {
    logout();
    router.replace("/");
  }

  function handleCorrection() {
    showToast(t("correction_sent"), "success");
  }

  const personalRows = [
    { label: "Date of Birth", value: new Date(student.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
    { label: "Gender", value: student.gender },
    { label: "Blood Group", value: student.bloodGroup },
    { label: "Guardian", value: student.guardianName },
    { label: "Contact", value: student.guardianContact, mono: true },
    { label: "Address", value: student.address },
  ];

  const academicRows = [
    { label: "GR Number", value: student.grNumber, mono: true },
    { label: "PRN", value: student.id, mono: true },
    { label: "Department", value: student.department },
    { label: "Year / Semester", value: `Year ${student.year} · Semester ${student.semester}` },
    { label: "Division", value: student.division },
    { label: "Admission Date", value: new Date(student.admissionDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 py-4">
        {/* Avatar */}
        <div className="w-[88px] h-[88px] rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
          <span className="text-white text-3xl font-semibold font-mono">{initials}</span>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-[22px] font-semibold text-[#1E2A4A]">{student.name}</h1>
          <p className="font-mono text-xs text-[#33363D]/60 mt-0.5">{student.id}</p>
          <div className="mt-2">
            <StatusBadge status="active" />
          </div>
        </div>
      </div>

      {/* Personal info card */}
      <section aria-labelledby="personal-heading">
        <h2 id="personal-heading" className="font-heading text-base font-semibold text-[#1E2A4A] mb-2">
          {t("personal_info")}
        </h2>
        <Card>
          <dl className="divide-y divide-[#33363D]/8">
            {personalRows.map(({ label, value, mono }) => (
              <div key={label} className="flex items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-xs text-[#33363D]/60 shrink-0 w-28">{label}</dt>
                <dd className={["text-sm text-[#1E2A4A] text-right leading-snug", mono ? "font-mono" : ""].join(" ")}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* Academic info card */}
      <section aria-labelledby="academic-heading">
        <h2 id="academic-heading" className="font-heading text-base font-semibold text-[#1E2A4A] mb-2">
          {t("academic_info")}
        </h2>
        <Card>
          <dl className="divide-y divide-[#33363D]/8">
            {academicRows.map(({ label, value, mono }) => (
              <div key={label} className="flex items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-xs text-[#33363D]/60 shrink-0 w-28">{label}</dt>
                <dd className={["text-sm text-[#1E2A4A] text-right leading-snug", mono ? "font-mono" : ""].join(" ")}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* Request correction */}
      <Button variant="secondary" fullWidth onClick={handleCorrection}>
        {t("request_correction")}
      </Button>

      {/* View ID card */}
      <Link href="/student/idcard" className="block">
        <Button variant="primary" fullWidth size="lg">
          {t("view_id_card")}
        </Button>
      </Link>

      {/* Logout */}
      <Button variant="destructive" fullWidth onClick={handleLogout}>
        {t("logout")}
      </Button>
    </div>
  );
}
