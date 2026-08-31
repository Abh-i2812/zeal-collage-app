"use client";
import { useState, useEffect } from "react";
import { documents, students, getStudent } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Chip } from "@/components/ui/Chip";

export default function AdminCertificatesPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const docList = documents;

  function handleApprove(label: string) {
    showToast(`Approved and issued ${label}`, "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">Certificates & Documents</h1>
          <p className="text-sm text-[#33363D]/60 mt-0.5">Manage student certificate requests and verifications</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Chip label="All Requests" active={filter === "all"} onClick={() => setFilter("all")} />
        <Chip label="Ready" active={filter === "ready"} onClick={() => setFilter("ready")} />
        <Chip label="Pending" active={filter === "pending"} onClick={() => setFilter("pending")} />
      </div>

      <div className="space-y-3">
        {docList.map((doc) => {
          const student = getStudent(doc.studentId);
          return (
            <Card key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2A4A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E2A4A]">{doc.label}</p>
                  <p className="text-xs text-[#33363D]/60">
                    {student?.name ?? "Student"} · <span className="font-mono">{doc.studentId}</span>
                  </p>
                  <p className="text-[11px] text-[#33363D]/50 mt-0.5">
                    Requested on {new Date(doc.requestedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <StatusBadge status={doc.status === "ready" ? "ready" : "pending"} label={doc.status === "ready" ? "Ready" : "Pending"} />
                {doc.status !== "ready" ? (
                  <Button variant="primary" size="sm" onClick={() => handleApprove(doc.label)}>
                    Approve & Issue
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => showToast(`Downloading ${doc.label}`, "info")}>
                    Download
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
