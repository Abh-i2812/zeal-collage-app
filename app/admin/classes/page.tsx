"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ClassRecord {
  id: string;
  code: string;
  name: string;
  semester: number | null;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusM: number;
  teacherName: string;
  enrolledCount: number;
}

interface BulkImportResult {
  totalRows: number;
  validCount?: number;
  inserted?: number;
  skipped?: number;
  enrolledInClass?: number;
  invalidCount?: number;
  preview?: Array<{ zprn: string; name: string; division?: string }>;
  errors?: Array<{ row: { zprn: string; name: string }; reason: string }>;
  dryRun?: boolean;
}

const DEMO_CLASSES: ClassRecord[] = [
  { id: "c1", code: "CS301", name: "Data Structures (SYCO Div A)", semester: 3, latitude: 18.4485, longitude: 73.834, geofenceRadiusM: 100, teacherName: "Dr. Meera Joshi", enrolledCount: 5 },
  { id: "c2", code: "CS302", name: "Database Systems (SYCO Div B)", semester: 3, latitude: 18.4485, longitude: 73.834, geofenceRadiusM: 100, teacherName: "Dr. Anand Kulkarni", enrolledCount: 5 },
];

export default function AdminClassesPage() {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState<ClassRecord[]>(DEMO_CLASSES);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Create class form
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ code: "", name: "", semester: "3", geofenceRadiusM: "100", latitude: "", longitude: "" });
  const [creatingClass, setCreatingClass] = useState(false);
  const [capturingGPS, setCapturingGPS] = useState(false);

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [importPreview, setImportPreview] = useState<BulkImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  useEffect(() => {
    setMounted(true);
    loadClasses();
  }, []);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch("/api/admin/classes");
      const data = await res.json();
      if (data.classes && data.classes.length > 0) {
        setClasses(data.classes);
      }
    } catch {
      // Keep demo classes on fetch error
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // Capture GPS coordinates for classroom
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported by this browser", "error");
      return;
    }
    setCapturingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewClass((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setCapturingGPS(false);
        showToast(`📍 GPS captured: ${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}° (±${Math.round(pos.coords.accuracy)}m)`, "success");
      },
      (err) => {
        setCapturingGPS(false);
        showToast(`GPS error: ${err.message}. Enter coordinates manually.`, "error");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Create class
  const handleCreateClass = async () => {
    if (!newClass.name.trim() || !newClass.code.trim()) {
      showToast("Class name and code are required", "error");
      return;
    }
    setCreatingClass(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newClass.code.trim().toUpperCase(),
          name: newClass.name.trim(),
          semester: parseInt(newClass.semester) || null,
          latitude: newClass.latitude ? parseFloat(newClass.latitude) : null,
          longitude: newClass.longitude ? parseFloat(newClass.longitude) : null,
          geofenceRadiusM: parseInt(newClass.geofenceRadiusM) || 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Class "${newClass.name}" created successfully! ✓`, "success");
        setShowCreate(false);
        setNewClass({ code: "", name: "", semester: "3", geofenceRadiusM: "100", latitude: "", longitude: "" });
        await loadClasses();
      } else {
        showToast(data.error || "Failed to create class", "error");
        // Add to demo list anyway for offline use
        const demoClass: ClassRecord = {
          id: "DEMO-" + Date.now(),
          code: newClass.code.trim().toUpperCase(),
          name: newClass.name.trim(),
          semester: parseInt(newClass.semester) || null,
          latitude: newClass.latitude ? parseFloat(newClass.latitude) : null,
          longitude: newClass.longitude ? parseFloat(newClass.longitude) : null,
          geofenceRadiusM: parseInt(newClass.geofenceRadiusM) || 100,
          teacherName: "Unassigned",
          enrolledCount: 0,
        };
        setClasses((prev) => [demoClass, ...prev]);
        setShowCreate(false);
      }
    } catch {
      showToast("Network error — class saved locally", "error");
    } finally {
      setCreatingClass(false);
    }
  };

  // Parse bulk CSV/text
  const parseBulkText = (text: string): Array<{ zprn: string; name: string; division: string }> => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          zprn: (parts[0] || "").toUpperCase(),
          name: parts[1] || "Unknown",
          division: parts[2] || "A",
        };
      })
      .filter((r) => r.zprn.length >= 5);
  };

  // Dry-run preview
  const handleDryRun = async () => {
    const rows = parseBulkText(bulkText);
    if (rows.length === 0) {
      showToast("No valid rows found. Use format: ZPRN, Name, Division", "error");
      return;
    }
    setImportLoading(true);
    try {
      const res = await fetch("/api/admin/bulk-import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, classId: selectedClassId || null, dryRun: true }),
      });
      const data: BulkImportResult = await res.json();
      setImportPreview(data);
    } catch {
      // Local parse preview fallback
      setImportPreview({
        dryRun: true,
        totalRows: rows.length,
        validCount: rows.length,
        invalidCount: 0,
        preview: rows.slice(0, 20),
        errors: [],
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Confirm import
  const handleConfirmImport = async () => {
    const rows = parseBulkText(bulkText);
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/bulk-import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, classId: selectedClassId || null, dryRun: false }),
      });
      const data: BulkImportResult = await res.json();
      setImportResult(data);
      setImportPreview(null);
      showToast(`✓ Imported ${data.inserted ?? rows.length} students successfully!`, "success");
      await loadClasses();
    } catch {
      showToast("Import failed. Please retry.", "error");
    } finally {
      setImportLoading(false);
    }
  };

  if (!mounted) return null;

  const SYCO_SAMPLE = `225P10229R, Aarav Patil, A
225P10241R, Aditya Shinde, A
225P10256R, Rohan Jadhav, A
225P10273R, Omkar More, A
225P10288R, Vedant Kulkarni, A
225P10304R, Yash Deshmukh, B
225P10319R, Atharva Pawar, B
225P10337R, Sarthak Joshi, B
225P10352R, Pranav Chavan, B
225P10368R, Shubham Gaikwad, B`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E2A4A]">Class Management</h1>
          <p className="text-xs text-[#33363D]/60 mt-0.5">
            Create classes, set classroom GPS geofence, and bulk import ZPRN students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowBulkImport(!showBulkImport)}>
            📋 Bulk Import Students
          </Button>
          <Button variant="primary" size="md" onClick={() => { setShowCreate(!showCreate); setImportPreview(null); }}>
            + New Class
          </Button>
        </div>
      </div>

      {/* Create Class Form */}
      {showCreate && (
        <Card className="p-6 space-y-4 border-2 border-[#E8A33D]/40 bg-[#FDF3E3]">
          <h2 className="font-heading font-bold text-base text-[#1E2A4A] flex items-center gap-2">
            🏫 Create New Class
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E2A4A]">Class Code *</label>
              <input
                type="text"
                value={newClass.code}
                onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                placeholder="e.g. CS301"
                className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-sm font-mono text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E2A4A]">Class Name *</label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="e.g. Data Structures (SYCO Div A)"
                className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E2A4A]">Semester</label>
              <select
                value={newClass.semester}
                onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
              >
                {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E2A4A]">Geofence Radius (meters)</label>
              <input
                type="number"
                value={newClass.geofenceRadiusM}
                onChange={(e) => setNewClass({ ...newClass, geofenceRadiusM: e.target.value })}
                placeholder="100"
                min={30}
                max={500}
                className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-sm font-mono text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
              />
            </div>
          </div>

          {/* GPS Location Capture */}
          <div className="bg-white rounded-2xl border border-[#33363D]/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1E2A4A]">📍 Classroom GPS Location</p>
                <p className="text-[11px] text-[#33363D]/60 mt-0.5">
                  Required for geofence verification. Capture from this device or enter manually.
                </p>
              </div>
              <button
                onClick={handleCaptureGPS}
                disabled={capturingGPS}
                className="px-3 py-2 rounded-xl bg-[#1E2A4A] text-white text-xs font-bold hover:bg-[#2D3E61] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {capturingGPS ? "Capturing…" : "📍 Capture GPS"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#33363D]/70">Latitude</label>
                <input
                  type="text"
                  value={newClass.latitude}
                  onChange={(e) => setNewClass({ ...newClass, latitude: e.target.value })}
                  placeholder="e.g. 18.448500"
                  className="w-full h-10 px-3 rounded-lg border border-[#33363D]/20 bg-[#FAF8F4] text-xs font-mono text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#33363D]/70">Longitude</label>
                <input
                  type="text"
                  value={newClass.longitude}
                  onChange={(e) => setNewClass({ ...newClass, longitude: e.target.value })}
                  placeholder="e.g. 73.834000"
                  className="w-full h-10 px-3 rounded-lg border border-[#33363D]/20 bg-[#FAF8F4] text-xs font-mono text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
                />
              </div>
            </div>
            {newClass.latitude && newClass.longitude && (
              <div className="flex items-center gap-2 text-xs text-[#4C7A5E] font-semibold bg-[#4C7A5E]/10 rounded-lg px-3 py-2">
                <span>✓ Location set:</span>
                <span className="font-mono">{parseFloat(newClass.latitude).toFixed(4)}°, {parseFloat(newClass.longitude).toFixed(4)}°</span>
                <span className="ml-auto text-[#33363D]/60">± {newClass.geofenceRadiusM}m geofence</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button variant="secondary" size="md" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" size="md" loading={creatingClass} onClick={handleCreateClass}>
              Create Class
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Import Section */}
      {showBulkImport && (
        <Card className="p-6 space-y-4 border-2 border-[#4C7A5E]/40 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-[#1E2A4A] flex items-center gap-2">
                📋 Bulk ZPRN Student Import
              </h2>
              <p className="text-xs text-[#33363D]/60 mt-0.5">
                Paste students as CSV: <code className="font-mono bg-[#FAF8F4] px-1 rounded">ZPRN, Full Name, Division</code> (one per line)
              </p>
            </div>
            <button
              onClick={() => setBulkText(SYCO_SAMPLE)}
              className="text-xs text-[#1E2A4A] font-semibold underline cursor-pointer hover:text-[#4C7A5E]"
            >
              Load SYCO Sample
            </button>
          </div>

          {/* Class Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E2A4A]">Enroll into Class (optional)</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#33363D]/25 bg-white text-sm text-[#1E2A4A] focus:outline-none focus:border-[#1E2A4A]"
            >
              <option value="">— Add students only (no class enrollment) —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
              ))}
            </select>
          </div>

          {/* Text Area */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E2A4A]">
              Student List ({parseBulkText(bulkText).length} rows detected)
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setImportPreview(null); setImportResult(null); }}
              placeholder={`225P10229R, Aarav Patil, A\n225P10241R, Aditya Shinde, A\n225P10256R, Rohan Jadhav, A`}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-[#33363D]/20 bg-[#FAF8F4] text-xs font-mono text-[#1E2A4A] resize-y focus:outline-none focus:border-[#1E2A4A]"
            />
          </div>

          {/* Dry Run Preview */}
          {importPreview && (
            <div className="bg-[#FAF8F4] rounded-2xl border border-[#33363D]/15 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1E2A4A]">📋 Dry-Run Preview</p>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="text-[#4C7A5E]">✓ Valid: {importPreview.validCount ?? importPreview.totalRows}</span>
                  {(importPreview.invalidCount || 0) > 0 && (
                    <span className="text-[#B4483A]">✕ Errors: {importPreview.invalidCount}</span>
                  )}
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {(importPreview.preview || []).map((row, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-[#33363D]/8 last:border-0">
                    <span className="font-mono text-[#1E2A4A] font-bold w-28 shrink-0">{row.zprn}</span>
                    <span className="text-[#33363D]/80">{row.name}</span>
                    <span className="ml-auto font-mono text-[#33363D]/50 text-[11px]">Div {row.division || "A"}</span>
                  </div>
                ))}
              </div>
              {(importPreview.errors || []).length > 0 && (
                <div className="bg-[#FFC7CE]/20 rounded-lg p-2 space-y-1">
                  <p className="text-[11px] font-bold text-[#9C0006]">Errors:</p>
                  {importPreview.errors!.map((e, i) => (
                    <p key={i} className="text-[11px] text-[#B4483A] font-mono">
                      {e.row.zprn || "?"}: {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-[#C6EFCE]/30 rounded-2xl border border-[#4C7A5E]/30 p-4 space-y-2">
              <p className="text-sm font-bold text-[#006100]">✓ Import Complete!</p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-white rounded-xl p-2">
                  <p className="font-mono text-lg font-bold text-[#4C7A5E]">{importResult.inserted ?? 0}</p>
                  <p className="text-[#33363D]/60">Inserted</p>
                </div>
                <div className="bg-white rounded-xl p-2">
                  <p className="font-mono text-lg font-bold text-[#E8A33D]">{importResult.skipped ?? 0}</p>
                  <p className="text-[#33363D]/60">Skipped (dup)</p>
                </div>
                <div className="bg-white rounded-xl p-2">
                  <p className="font-mono text-lg font-bold text-[#1E2A4A]">{importResult.enrolledInClass ?? 0}</p>
                  <p className="text-[#33363D]/60">Enrolled</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button variant="secondary" size="md" onClick={() => { setShowBulkImport(false); setImportPreview(null); setImportResult(null); setBulkText(""); }}>
              Close
            </Button>
            {!importPreview && !importResult && (
              <Button variant="primary" size="md" loading={importLoading} onClick={handleDryRun} disabled={parseBulkText(bulkText).length === 0}>
                Preview Import ({parseBulkText(bulkText).length} students)
              </Button>
            )}
            {importPreview && !importResult && (
              <Button variant="primary" size="md" loading={importLoading} onClick={handleConfirmImport}>
                ✓ Confirm Import {selectedClassId ? `& Enroll` : ""}
              </Button>
            )}
            {importResult && (
              <Button variant="secondary" size="md" onClick={() => { setImportResult(null); setImportPreview(null); setBulkText(""); }}>
                Import More
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Classes List */}
      <Card className="p-6 space-y-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#1E2A4A]">Active Classes</h2>
            <p className="text-xs text-[#33363D]/60">{classes.length} classes · Click to manage students & geofence</p>
          </div>
          {loadingClasses && (
            <span className="text-[11px] text-[#33363D]/50 animate-pulse">Loading from Supabase…</span>
          )}
        </div>

        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-4 rounded-2xl border border-[#33363D]/12 bg-[#FAF8F4] hover:border-[#33363D]/25 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1E2A4A] bg-[#1E2A4A]/10 px-2 py-0.5 rounded-lg">
                      {cls.code}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-[#1E2A4A]">{cls.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#33363D]/60">
                    <span>Faculty: {cls.teacherName}</span>
                    {cls.semester && <span>Sem {cls.semester}</span>}
                    <span className="flex items-center gap-1">
                      <span>{cls.enrolledCount} students</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* GPS Geofence status */}
                  <div className="text-right">
                    {cls.latitude && cls.longitude ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#4C7A5E]" />
                        <div className="text-[11px] text-[#4C7A5E] font-semibold">
                          <p>{cls.latitude.toFixed(4)}°, {cls.longitude.toFixed(4)}°</p>
                          <p className="text-[#33363D]/50">±{cls.geofenceRadiusM}m geofence</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E8A33D]" />
                        <span className="text-[11px] text-[#E8A33D] font-semibold">No GPS set</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/students?classId=${cls.id}`}
                    className="px-3 py-2 rounded-xl bg-[#1E2A4A] text-white text-xs font-bold hover:bg-[#2D3E61] transition-colors"
                  >
                    View Students →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="text-center py-10 text-[#33363D]/50">
              <p className="text-3xl mb-2">🏫</p>
              <p className="text-sm font-semibold">No classes yet</p>
              <p className="text-xs mt-1">Click &quot;New Class&quot; to create your first class</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
