// lib/qr/qrSession.ts
// ─────────────────────────────────────────────────────────────────────
// Session Lifecycle: Start Session, Rotate Token every 30s, Close Session
// ─────────────────────────────────────────────────────────────────────
import { AttendanceSession, QRPayload } from "./qrTypes";
import {
  saveSession,
  getSessionById,
  getAllActiveSessions,
  saveAttendanceRecord,
  getOrCreateDeviceId,
} from "./qrStorage";

const TOKEN_WINDOW_SECONDS = 30;
const SESSION_DURATION_SECONDS = 2 * 60 * 60; // 2 hours

/** Generate structured Session ID: SES-YYYYMMDD-HHMMSS */
export function generateSessionId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `SES-${y}${m}${day}-${h}${min}${s}`;
}

/** Create and start a new active attendance session */
export function createAttendanceSession(
  subjectId: string,
  subjectName: string,
  teacherId: string,
  room: string
): AttendanceSession {
  const now = Math.floor(Date.now() / 1000);
  const sessionId = generateSessionId();

  const session: AttendanceSession = {
    sessionId,
    subjectId,
    subject: subjectName,
    teacherId,
    room,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
    status: "active",
    activeTokenCreatedAt: now,
    activeTokenExpiresAt: now + TOKEN_WINDOW_SECONDS,
    tokenIndex: 1,
    attendance: [],
    flaggedDevices: {},
  };

  saveSession(session);
  return session;
}

/** Rotate the 30-second token for an active session */
export function rotateSessionToken(sessionId: string): AttendanceSession | null {
  const session = getSessionById(sessionId);
  if (!session || session.status !== "active") return null;

  const now = Math.floor(Date.now() / 1000);
  session.activeTokenCreatedAt = now;
  session.activeTokenExpiresAt = now + TOKEN_WINDOW_SECONDS;
  session.tokenIndex = (session.tokenIndex || 1) + 1;

  saveSession(session);
  return session;
}

/** Close an active attendance session */
export function closeAttendanceSession(sessionId: string): AttendanceSession | null {
  const session = getSessionById(sessionId);
  if (!session) return null;

  session.status = "closed";
  saveSession(session);
  return session;
}

/** Build the QRPayload for the current 30s token window */
export function getCurrentQRPayload(session: AttendanceSession): QRPayload {
  return {
    type: "ZCOER_ATTENDANCE",
    sessionId: session.sessionId,
    subjectId: session.subjectId,
    subject: session.subject,
    teacherId: session.teacherId,
    room: session.room,
    tokenIndex: session.tokenIndex || 1,
    createdAt: session.activeTokenCreatedAt,
    expiresAt: session.activeTokenExpiresAt,
  };
}

/** Mark student attendance in storage */
export function recordStudentCheckIn(
  payload: QRPayload,
  studentId: string,
  studentName: string,
  method: "qr-camera" | "qr-demo" = "qr-camera"
): boolean {
  const deviceId = getOrCreateDeviceId();
  const now = Math.floor(Date.now() / 1000);

  saveAttendanceRecord({
    studentId,
    studentName,
    sessionId: payload.sessionId,
    subjectId: payload.subjectId,
    subject: payload.subject,
    room: payload.room,
    status: "present",
    markedAt: now,
    method,
    deviceId,
  });

  return true;
}

/** Get list of active sessions (useful for demo fallback scanner) */
export function getActiveSessionsForDemo(): AttendanceSession[] {
  return getAllActiveSessions();
}
