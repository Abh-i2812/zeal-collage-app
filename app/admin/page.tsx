"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface ClassSessionOverview {
  id: string;
  className: string;
  teacherName: string;
  date: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  status: "active" | "closed";
}

export default function AdminPortalPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<ClassSessionOverview[]>([
    {
      id: "SES-CS301-01",
      className: "CS301 - Data Structures",
      teacherName: "Dr. Meera Joshi",
      date: new Date().toISOString().split("T")[0],
      totalEnrolled: 62,
      presentCount: 58,
      absentCount: 4,
      status: "closed",
    },
    {
      id: "SES-CS302-01",
      className: "CS302 - Database Systems",
      teacherName: "Dr. Meera Joshi",
      date: new Date().toISOString().split("T")[0],
      totalEnrolled: 60,
      presentCount: 55,
      absentCount: 5,
      status: "closed",
    },
    {
      id: "SES-CS303-01",
      className: "CS303 - Computer Networks",
      teacherName: "Prof. Anand Kulkarni",
      date: new Date().toISOString().split("T")[0],
      totalEnrolled: 58,
      presentCount: 50,
      absentCount: 8,
      status: "closed",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportSession = async (session: ClassSessionOverview) => {
    try {
      showToast(`Generating Excel export for ${session.className}…`, "info");
      const res = await fetch("/api/excel-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: session.className.replace(/[^a-zA-Z0-9]/g, "_"),
          sessionDate: session.date,
          records: [
            { rollNumber: "72201234M", fullName: "Aarav Sharma", status: "present", scannedAt: "10:02:14 AM", distanceM: 14.2, deviceMatch: true },
            { rollNumber: "72201235M", fullName: "Priya Desai", status: "present", scannedAt: "10:03:05 AM", distanceM: 28.5, deviceMatch: true },
            { rollNumber: "72201236M", fullName: "Rohit Patil", status: "absent", scannedAt: null, distanceM: null, deviceMatch: null, rejectReason: "Did not scan" },
            { rollNumber: "72201237M", fullName: "Sneha Kulkarni", status: "rejected", scannedAt: "10:04:12 AM", distanceM: 145.8, deviceMatch: true, rejectReason: "outside classroom range" },
            { rollNumber: "72201238M", fullName: "Arjun Nair", status: "present", scannedAt: "10:02:44 AM", distanceM: 12.1, deviceMatch: true },
          ],
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${session.className}_Attendance_${session.date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast(`Downloaded ${session.className} Excel sheet! 📊`, "success");
    } catch (err) {
      console.error(err);
      showToast("Export failed. Please try again.", "error");
    }
  };

  if (!mounted) return null;

  const totalPresent = sessions.reduce((acc, s) => acc + s.presentCount, 0);
  const totalEnrolled = sessions.reduce((acc, s) => acc + s.totalEnrolled, 0);
  const overallPct = totalEnrolled > 0 ? ((totalPresent / totalEnrolled) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-[#FAF8F4] p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#33363D]/12 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ZCOER Logo" className="w-12 h-12 object-contain shrink-0" />
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-[#1E2A4A]">
              Admin Attendance Dashboard
            </h1>
            <p className="text-xs text-[#33363D]/60 mt-0.5">
              Cross-Class Reports &amp; Formatted Excel Export Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/teacher"
            className="px-4 py-2 rounded-xl bg-[#1E2A4A] text-white font-bold text-xs hover:bg-[#2D3E61] transition-colors"
          >
            ← Teacher Portal
          </Link>
          <Link
            href="/scan"
            className="px-4 py-2 rounded-xl border border-[#33363D]/20 text-xs font-semibold text-[#1E2A4A] hover:bg-[#FAF8F4]"
          >
            📱 Scan Page
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-[#33363D]/60 uppercase tracking-wider">Total Active Classes</p>
          <p className="font-mono text-3xl font-extrabold text-[#1E2A4A]">{sessions.length} Sessions</p>
          <p className="text-[11px] text-[#4C7A5E] font-semibold">Today&apos;s Lecture Schedule</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-[#33363D]/60 uppercase tracking-wider">Average Attendance</p>
          <p className="font-mono text-3xl font-extrabold text-[#4C7A5E]">{overallPct}%</p>
          <p className="text-[11px] text-[#4C7A5E] font-semibold">{totalPresent} of {totalEnrolled} Verified Present</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-[#33363D]/60 uppercase tracking-wider">Defaulter Flag (&lt;75%)</p>
          <p className="font-mono text-3xl font-extrabold text-[#B4483A]">17 Students</p>
          <p className="text-[11px] text-[#B4483A] font-semibold">SPPU Exam Warning Flagged</p>
        </div>
      </div>

      {/* Sessions & Excel Export Table */}
      <Card className="p-6 space-y-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#33363D]/10">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">Daily Lecture Sessions</h2>
            <p className="text-xs text-[#33363D]/60 mt-0.5">Select any session to download its formatted Excel sheet (.xlsx)</p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#33363D]/20 bg-white text-xs font-medium text-[#1E2A4A]"
          />
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((s) => {
            const pct = Math.round((s.presentCount / s.totalEnrolled) * 100);

            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-[#33363D]/12 bg-[#FAF8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#33363D]/25"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-[#1E2A4A]">{s.className}</h3>
                    <span className="text-[10px] font-bold text-[#4C7A5E] bg-[#4C7A5E]/15 border border-[#4C7A5E]/30 px-2 py-0.5 rounded-full uppercase">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#33363D]/70">
                    Faculty: {s.teacherName} · Date: {s.date}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-[#1E2A4A]">
                      {s.presentCount} / {s.totalEnrolled} ({pct}%)
                    </p>
                    <p className="text-[10px] text-[#33363D]/60">Present Ratio</p>
                  </div>

                  <button
                    onClick={() => handleExportSession(s)}
                    className="px-4 py-2.5 rounded-xl bg-[#305496] hover:bg-[#203D72] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>📊</span>
                    <span>Export Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
