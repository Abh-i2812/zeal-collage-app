"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";
import { documents } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function DocumentsPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestType, setRequestType] = useState("bonafide");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <ListSkeleton />;

  const session = getSession();
  if (!session) return null;

  const studentDocs = documents.filter((d) => d.studentId === session.id);

  function handleDownload(label: string) {
    showToast(`Opening ${label}…`, "success");
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      showToast("Document request submitted successfully", "success");
      setShowRequest(false);
      setSubmitting(false);
    }, 800);
  }

  const docTypeLabel: Record<string, string> = {
    bonafide: "Bonafide Certificate",
    fee_receipt: "Fee Receipt",
    migration: "Migration Certificate",
    character: "Character Certificate",
  };

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">{t("documents_title")}</h1>
        <Button variant="primary" size="sm" onClick={() => setShowRequest(true)}>
          {t("request_document")}
        </Button>
      </div>

      {studentDocs.length === 0 ? (
        <EmptyState
          message="No documents yet — request one above"
          actionLabel={t("request_document")}
          onAction={() => setShowRequest(true)}
        />
      ) : (
        <div className="space-y-3">
          {studentDocs.map((doc) => (
            <Card key={doc.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* File icon */}
                <div className="w-10 h-10 rounded-lg bg-[#1E2A4A]/5 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E2A4A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E2A4A] truncate">{doc.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge
                      status={doc.status === "ready" ? "ready" : doc.status === "processing" ? "processing" : "pending"}
                      label={t(`status_${doc.status}`)}
                    />
                    {doc.readyDate && (
                      <p className="text-xs text-[#33363D]/50">
                        {new Date(doc.readyDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {doc.status === "ready" && (
                <Button variant="secondary" size="sm" onClick={() => handleDownload(doc.label)}>
                  {t("download")}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Request form overlay */}
      {showRequest && (
        <div className="fixed inset-0 z-50 bg-[#1E2A4A]/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-[#1E2A4A]">{t("request_document")}</h3>
              <button
                onClick={() => setShowRequest(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#33363D]/60 hover:bg-[#33363D]/5"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1E2A4A]">Document type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
                >
                  {Object.entries(docTypeLabel).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1E2A4A]">Purpose / remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Required for passport application"
                  className="w-full px-3 py-2 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A] resize-none"
                />
              </div>
              <Button type="submit" variant="primary" fullWidth loading={submitting}>
                {t("submit")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
