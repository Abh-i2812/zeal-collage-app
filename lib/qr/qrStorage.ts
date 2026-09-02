// lib/qr/qrStorage.ts
// ─────────────────────────────────────────────────────────────────────
// LocalStorage Persistence for Sessions, Attendance, and Device Identification
// ─────────────────────────────────────────────────────────────────────
import { AttendanceSession, StoredAttendanceRecord } from "./qrTypes";

export const SESSIONS_KEY = "zcoer_attendance_sessions";
export const ATTENDANCE_KEY = "zcoer_attendance";
export const DEVICE_ID_KEY = "zcoer_device_id";
const DEVICE_COOKIE = "zcoer_device_id";

// ── Device ID Management (for simulated multi-device detection) ───────
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "dev-ssr";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "dev-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    // Mirroring in a cookie makes clearing localStorage alone insufficient to
    // silently rotate the device identity on deployments that enforce binding.
    document.cookie = `${DEVICE_COOKIE}=${encodeURIComponent(id)}; Max-Age=31536000; Path=/; SameSite=Lax`;
    return id;
  } catch {
    return "dev-fallback";
  }
}

// ── Session Storage Operations ────────────────────────────────────────
export function getStoredSessions(): Record<string, AttendanceSession> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to parse stored sessions:", err);
    return {};
  }
}

export function saveSession(session: AttendanceSession): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions();
    sessions[session.sessionId] = session;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

export function getSessionById(sessionId: string): AttendanceSession | null {
  const sessions = getStoredSessions();
  return sessions[sessionId] || null;
}

export function getAllActiveSessions(): AttendanceSession[] {
  const sessions = getStoredSessions();
  const now = Math.floor(Date.now() / 1000);
  return Object.values(sessions).filter(
    (s) => s.status === "active" && s.expiresAt > now
  );
}

// ── Attendance Records Storage Operations ─────────────────────────────
export function getStoredAttendance(): StoredAttendanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to parse stored attendance:", err);
    return [];
  }
}

export function saveAttendanceRecord(record: StoredAttendanceRecord): void {
  if (typeof window === "undefined") return;
  try {
    const all = getStoredAttendance();
    // Prevent duplicate entry with same studentId and sessionId
    const filtered = all.filter(
      (r) => !(r.studentId === record.studentId && r.sessionId === record.sessionId)
    );
    filtered.push(record);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));

    // Also update the session's attendance list
    const session = getSessionById(record.sessionId);
    if (session) {
      if (!session.attendance.includes(record.studentId)) {
        session.attendance.push(record.studentId);
      }

      // Track device IDs for multi-device detection
      if (!session.flaggedDevices) session.flaggedDevices = {};
      if (!session.flaggedDevices[record.studentId]) {
        session.flaggedDevices[record.studentId] = [];
      }
      if (!session.flaggedDevices[record.studentId].includes(record.deviceId)) {
        session.flaggedDevices[record.studentId].push(record.deviceId);
      }

      saveSession(session);
    }
  } catch (err) {
    console.error("Failed to save attendance record:", err);
  }
}

export function getStudentAttendanceForSession(
  studentId: string,
  sessionId: string
): StoredAttendanceRecord | null {
  const records = getStoredAttendance();
  return records.find((r) => r.studentId === studentId && r.sessionId === sessionId) || null;
}

export function getStudentAttendanceHistory(studentId: string): StoredAttendanceRecord[] {
  const records = getStoredAttendance();
  return records
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.markedAt - a.markedAt);
}

export function updateStudentRecordStatus(
  sessionId: string,
  studentId: string,
  newStatus: "present" | "absent",
  studentName: string,
  subjectId: string,
  subjectName: string,
  room: string
): void {
  if (typeof window === "undefined") return;
  const records = getStoredAttendance();
  const existingIdx = records.findIndex(
    (r) => r.sessionId === sessionId && r.studentId === studentId
  );

  const deviceId = getOrCreateDeviceId();
  const now = Math.floor(Date.now() / 1000);

  if (existingIdx >= 0) {
    records[existingIdx].status = newStatus;
  } else {
    records.push({
      studentId,
      studentName,
      sessionId,
      subjectId,
      subject: subjectName,
      room,
      status: newStatus,
      markedAt: now,
      method: "manual",
      deviceId,
    });
  }

  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));

  // Update session attendance list
  const session = getSessionById(sessionId);
  if (session) {
    if (newStatus === "present" && !session.attendance.includes(studentId)) {
      session.attendance.push(studentId);
    } else if (newStatus === "absent" && session.attendance.includes(studentId)) {
      session.attendance = session.attendance.filter((id) => id !== studentId);
    }
    saveSession(session);
  }
}
