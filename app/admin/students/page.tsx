"use client";
import { useState, useEffect } from "react";
import {
  students as seedStudents,
  subjects,
  getAddedStudents,
  addStudentToMock,
  type Student,
} from "@/lib/mockDb";
import { useLocale } from "@/lib/locales";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";

const YEARS = ["All", "Year 1", "Year 2", "Year 3", "Year 4"];
const DEPTS = ["All", "Computer Engineering", "Information Technology", "Mechanical Engineering"];

// 3-step add form state
interface NewStudentForm {
  // Step 1 — personal
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  guardianName: string;
  guardianContact: string;
  address: string;
  // Step 2 — academic
  id: string;       // PRN
  grNumber: string;
  department: string;
  year: string;
  semester: string;
  division: string;
  admissionDate: string;
}

const EMPTY_FORM: NewStudentForm = {
  name: "", dob: "", gender: "Male", bloodGroup: "B+",
  guardianName: "", guardianContact: "", address: "",
  id: "", grNumber: "", department: "Computer Engineering",
  year: "3", semester: "5", division: "A", admissionDate: new Date().toISOString().split("T")[0],
};

export default function AdminStudentsPage() {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formStep, setFormStep] = useState(0); // 0,1,2
  const [form, setForm] = useState<NewStudentForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAllStudents([...seedStudents, ...getAddedStudents()]);
    setMounted(true);
  }, []);

  if (!mounted) return <TableSkeleton />;

  // Filtering
  const filtered = allStudents.filter((s) => {
    const matchSearch =
      search.trim() === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchYear =
      yearFilter === "All" || `Year ${s.year}` === yearFilter;
    const matchDept =
      deptFilter === "All" || s.department === deptFilter;
    return matchSearch && matchYear && matchDept;
  });

  // Form handlers
  function updateForm(k: keyof NewStudentForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleAddSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const newStudent = addStudentToMock({
        id: form.id || `ZC${Date.now()}`,
        grNumber: form.grNumber || `GR${Date.now()}`,
        name: form.name,
        dob: form.dob || "2004-01-01",
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        guardianName: form.guardianName,
        guardianContact: form.guardianContact,
        address: form.address,
        department: form.department,
        year: Number(form.year),
        semester: Number(form.semester),
        division: form.division,
        admissionDate: form.admissionDate,
        feesDue: 0,
        documentsReady: 0,
      });
      setAllStudents([...seedStudents, ...getAddedStudents()]);
      showToast(`${form.name} added — they can log in with password 12345`, "success");
      setShowAddForm(false);
      setFormStep(0);
      setForm(EMPTY_FORM);
      setSubmitting(false);
    }, 800);
  }

  const steps = [t("step_personal"), t("step_academic"), t("step_review")];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">{t("admin_students")}</h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">Central Academic Records &amp; Enrollment Management</p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setShowAddForm(true); setFormStep(0); setForm(EMPTY_FORM); }}>
          + {t("add_student")}
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-semibold uppercase tracking-wider">Total Enrolled</p>
          <p className="font-mono text-2xl font-bold text-[#1E2A4A]">{allStudents.length} Students</p>
          <p className="text-[10px] text-[#4C7A5E] font-medium">All Branches Active</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-semibold uppercase tracking-wider">Daily Attendance</p>
          <p className="font-mono text-2xl font-bold text-[#4C7A5E]">87.4%</p>
          <p className="text-[10px] text-[#33363D]/60">QR Verified Today</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-semibold uppercase tracking-wider">Academic Defaulters</p>
          <p className="font-mono text-2xl font-bold text-[#B4483A]">1 Student</p>
          <p className="text-[10px] text-[#B4483A] font-medium">&lt; 75% Attendance Flag</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#33363D]/12 shadow-2xs space-y-1">
          <p className="text-[11px] text-[#33363D]/60 font-semibold uppercase tracking-wider">Documents Issued</p>
          <p className="font-mono text-2xl font-bold text-[#1E2A4A]">2 Ready</p>
          <p className="text-[10px] text-[#4C7A5E] font-medium">0 Pending Approvals</p>
        </div>
      </div>

      {/* Quick Export Strip */}
      <div className="bg-[#1E2A4A] text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="font-heading font-bold text-sm">📊 Export Class Attendance to Excel</p>
          <p className="text-xs text-white/70 mt-0.5">Download official attendance registers for FY-A..F, SY-A..F, TY divisions</p>
        </div>
        <a
          href="/admin/reports"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-[#E8A33D] text-[#1E2A4A] font-bold text-xs hover:bg-[#D97706] transition-colors text-center"
        >
          Open Excel Export Centre ➔
        </a>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <Input
          placeholder={t("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {YEARS.map((y) => (
            <Chip key={y} label={y} active={yearFilter === y} onClick={() => setYearFilter(y)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip label="All Depts" active={deptFilter === "All"} onClick={() => setDeptFilter("All")} />
          <Chip label="CE" active={deptFilter === "Computer Engineering"} onClick={() => setDeptFilter("Computer Engineering")} />
          <Chip label="IT" active={deptFilter === "Information Technology"} onClick={() => setDeptFilter("Information Technology")} />
          <Chip label="Mech" active={deptFilter === "Mechanical Engineering"} onClick={() => setDeptFilter("Mechanical Engineering")} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 text-sm text-[#33363D]/60">
        <span>{filtered.length} students</span>
        {(yearFilter !== "All" || deptFilter !== "All" || search) && (
          <button
            className="text-[#1E2A4A] underline underline-offset-2 text-sm"
            onClick={() => { setSearch(""); setYearFilter("All"); setDeptFilter("All"); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Student list — cards on mobile, table-like on desktop */}
      {filtered.length === 0 ? (
        <EmptyState
          message={t("empty_students")}
          actionLabel="Clear filters"
          onAction={() => { setSearch(""); setYearFilter("All"); setDeptFilter("All"); }}
        />
      ) : (
        <>
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-[#33363D]/60 uppercase tracking-wide">
            <span>Student</span>
            <span>PRN / GR</span>
            <span>Dept</span>
            <span>Year</span>
            <span>Status</span>
          </div>

          <div className="space-y-2">
            {filtered.map((student) => (
              <div key={student.id}>
                {/* Mobile card */}
                <Card onClick={() => setSelectedStudent(student)} className="md:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {student.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E2A4A] truncate">{student.name}</p>
                      <p className="font-mono text-xs text-[#33363D]/60">{student.id}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="active" />
                      <p className="text-xs text-[#33363D]/60 mt-1">Year {student.year}</p>
                    </div>
                  </div>
                </Card>

                {/* Desktop row */}
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="hidden md:grid w-full grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 bg-white rounded-lg border border-[#33363D]/10 hover:border-[#33363D]/25 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {student.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#1E2A4A] truncate">{student.name}</span>
                  </div>
                  <div className="font-mono text-xs text-[#33363D]/70 truncate">{student.id} / {student.grNumber}</div>
                  <span className="text-xs text-[#33363D]/70 text-right">{student.department.split(" ")[0]}</span>
                  <span className="text-xs text-[#33363D]/70 text-center">Y{student.year}</span>
                  <StatusBadge status="active" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Student detail drawer ─────────────────────────────────── */}
      <Drawer
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name}
      >
        {selectedStudent && (
          <div className="space-y-4">
            {/* Avatar + badge */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
                <span className="text-white text-lg font-semibold">
                  {selectedStudent.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-[#1E2A4A]">{selectedStudent.name}</p>
                <p className="font-mono text-xs text-[#33363D]/60">{selectedStudent.id}</p>
                <StatusBadge status="active" className="mt-1" />
              </div>
            </div>

            {/* Details */}
            {[
              { label: "GR Number",   value: selectedStudent.grNumber, mono: true },
              { label: "Department",  value: selectedStudent.department },
              { label: "Year / Sem",  value: `Year ${selectedStudent.year} · Sem ${selectedStudent.semester}` },
              { label: "Division",    value: selectedStudent.division },
              { label: "Blood Group", value: selectedStudent.bloodGroup, mono: true },
              { label: "Guardian",    value: selectedStudent.guardianName },
              { label: "Contact",     value: selectedStudent.guardianContact, mono: true },
              { label: "Address",     value: selectedStudent.address },
              { label: "Fees Due",    value: selectedStudent.feesDue > 0 ? `₹${selectedStudent.feesDue.toLocaleString("en-IN")}` : "Cleared", mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-start justify-between gap-2 py-2 border-b border-[#33363D]/8 last:border-0">
                <dt className="text-xs text-[#33363D]/60 shrink-0 w-24">{label}</dt>
                <dd className={["text-sm text-[#1E2A4A] text-right leading-snug", mono ? "font-mono" : ""].join(" ")}>{value}</dd>
              </div>
            ))}

            <div className="pt-2 space-y-2">
              <Button variant="secondary" fullWidth onClick={() => { showToast("Edit feature coming soon", "info"); }}>
                Edit Student
              </Button>
              <Button variant="destructive" fullWidth onClick={() => { showToast("Block feature coming soon", "error"); }}>
                Block Student
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Add student drawer (3-step form) ─────────────────────── */}
      <Drawer
        open={showAddForm}
        onClose={() => { setShowAddForm(false); setFormStep(0); }}
        title={t("add_student")}
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  i === formStep
                    ? "bg-[#E8A33D] text-[#1E2A4A]"
                    : i < formStep
                    ? "bg-[#4C7A5E] text-white"
                    : "bg-[#33363D]/10 text-[#33363D]/40",
                ].join(" ")}
              >
                {i < formStep ? "✓" : i + 1}
              </div>
              <span className={["text-xs", i === formStep ? "text-[#1E2A4A] font-medium" : "text-[#33363D]/50"].join(" ")}>
                {label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-[#33363D]/10" />}
            </div>
          ))}
        </div>

        {/* Step 0 — Personal */}
        {formStep === 0 && (
          <div className="space-y-3">
            <Input label="Full name *" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. Priya Sharma" />
            <Input label="Date of birth" type="date" value={form.dob} onChange={(e) => updateForm("dob", e.target.value)} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#1E2A4A]">Gender</label>
              <div className="flex gap-2">
                {["Male", "Female", "Other"].map((g) => (
                  <button key={g} onClick={() => updateForm("gender", g)}
                    className={["flex-1 h-10 rounded-lg border text-sm font-medium transition-colors", form.gender === g ? "bg-[#1E2A4A] text-white border-[#1E2A4A]" : "border-[#33363D]/25 text-[#33363D] hover:border-[#33363D]/50"].join(" ")}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#1E2A4A]">Blood group</label>
              <select value={form.bloodGroup} onChange={(e) => updateForm("bloodGroup", e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]">
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <Input label="Guardian name" value={form.guardianName} onChange={(e) => updateForm("guardianName", e.target.value)} />
            <Input label="Guardian contact" value={form.guardianContact} onChange={(e) => updateForm("guardianContact", e.target.value)} mono placeholder="+91 99999 99999" />
            <Input label="Address" value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
            <div className="pt-2">
              <Button variant="primary" fullWidth disabled={!form.name.trim()} onClick={() => setFormStep(1)}>{t("next")}</Button>
            </div>
          </div>
        )}

        {/* Step 1 — Academic */}
        {formStep === 1 && (
          <div className="space-y-3">
            <Input label="PRN" value={form.id} onChange={(e) => updateForm("id", e.target.value)} mono placeholder="e.g. 72201239M" />
            <Input label="GR Number" value={form.grNumber} onChange={(e) => updateForm("grNumber", e.target.value)} mono placeholder="e.g. GR2022006" />
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#1E2A4A]">Department</label>
              <select value={form.department} onChange={(e) => updateForm("department", e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]">
                {["Computer Engineering","Information Technology","Mechanical Engineering","Electronics & Telecommunication"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1E2A4A]">Year</label>
                <select value={form.year} onChange={(e) => updateForm("year", e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]">
                  {["1","2","3","4"].map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1E2A4A]">Division</label>
                <select value={form.division} onChange={(e) => updateForm("division", e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]">
                  {["A","B","C"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <Input label="Admission date" type="date" value={form.admissionDate} onChange={(e) => updateForm("admissionDate", e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" fullWidth onClick={() => setFormStep(0)}>{t("back")}</Button>
              <Button variant="primary" fullWidth onClick={() => setFormStep(2)}>{t("next")}</Button>
            </div>
          </div>
        )}

        {/* Step 2 — Review */}
        {formStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[#33363D]/60">Review details before adding the student.</p>
            <div className="bg-[#FAF8F4] rounded-xl border border-[#33363D]/10 divide-y divide-[#33363D]/8">
              {[
                { label: "Name", value: form.name || "—" },
                { label: "PRN", value: form.id || "Auto-generated", mono: true },
                { label: "GR", value: form.grNumber || "Auto-generated", mono: true },
                { label: "Department", value: form.department },
                { label: "Year", value: `Year ${form.year} · Div ${form.division}` },
                { label: "Blood Group", value: form.bloodGroup, mono: true },
                { label: "Password", value: "12345", mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-[#33363D]/60">{label}</span>
                  <span className={["text-sm text-[#1E2A4A]", mono ? "font-mono" : "font-medium"].join(" ")}>{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-[#E8A33D]/10 border border-[#E8A33D]/20 px-3 py-2.5 text-xs text-[#1E2A4A]">
              Student can log in immediately with password <span className="font-mono font-bold">12345</span>.
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setFormStep(1)}>{t("back")}</Button>
              <Button variant="primary" fullWidth loading={submitting} onClick={handleAddSubmit}>{t("submit")}</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
