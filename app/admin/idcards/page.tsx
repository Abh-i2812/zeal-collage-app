"use client";
import { useState, useEffect } from "react";
import { students as seedStudents, getAddedStudents, type Student } from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";

export default function AdminIDCardsPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedPRN, setSelectedPRN] = useState<string | null>(null);

  useEffect(() => {
    setAllStudents([...seedStudents, ...getAddedStudents()]);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function handleBatchPrint() {
    showToast("Generating batch PDF for all active ID cards…", "success");
  }

  function handlePrintOne(student: Student) {
    showToast(`Print job sent for ${student.name} (${student.id})`, "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-[#1E2A4A]">Digital ID Cards & Printing</h1>
          <p className="text-sm text-[#33363D]/60 mt-0.5">Generate and batch print official student identity cards</p>
        </div>
        <Button variant="primary" onClick={handleBatchPrint}>
          Print All Active ({allStudents.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allStudents.map((student) => {
          const initials = student.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
          return (
            <Card key={student.id} className="space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold font-mono">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E2A4A]">{student.name}</p>
                      <p className="font-mono text-xs text-[#33363D]/60">{student.id}</p>
                    </div>
                  </div>
                  <StatusBadge status="active" />
                </div>

                <div className="mt-3 pt-3 border-t border-[#33363D]/10 space-y-1 text-xs text-[#33363D]/70">
                  <p><span className="text-[#33363D]/50">Dept:</span> {student.department}</p>
                  <p><span className="text-[#33363D]/50">Year:</span> Year {student.year} (Div {student.division})</p>
                  <p><span className="text-[#33363D]/50">Blood Group:</span> <span className="font-mono">{student.bloodGroup}</span></p>
                  <p><span className="text-[#33363D]/50">Valid Till:</span> Jun 2027</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" fullWidth onClick={() => handlePrintOne(student)}>
                  Print ID Card
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
