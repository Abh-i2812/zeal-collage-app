// lib/qr/qrTypes.ts
// ─────────────────────────────────────────────────────────────────────
// Types for the Real QR Attendance System (Frontend-only with localStorage)
// ─────────────────────────────────────────────────────────────────────

export interface QRPayload {
  type: "ZCOER_ATTENDANCE";
  sessionId: string;
  subjectId: string;
  subject: string;
  teacherId: string;
  room: string;
  latitude?: number;
  longitude?: number;
  radiusM?: number;
  tokenIndex: number;
  createdAt: number; // Unix timestamp in seconds
  expiresAt: number; // Unix timestamp in seconds
}

export interface AttendanceSession {
  sessionId: string;
  subjectId: string;
  subject: string;
  teacherId: string;
  room: string;
  latitude?: number;
  longitude?: number;
  geofenceRadiusM?: number;
  createdAt: number; // Unix timestamp in seconds
  expiresAt: number; // Overall session expiry
  status: "active" | "closed";
  activeTokenCreatedAt: number; // Current 30s window start
  activeTokenExpiresAt: number; // Current 30s window end
  tokenIndex: number; // Increments every 30s (Token #1, #2, ...)
  attendance: string[]; // List of student IDs marked present
  flaggedDevices?: Record<string, string[]>; // studentId -> list of deviceIds
}

export interface StoredAttendanceRecord {
  studentId: string;
  studentName: string;
  sessionId: string;
  subjectId: string;
  subject: string;
  room: string;
  status: "present" | "absent";
  markedAt: number; // Unix timestamp in seconds
  method: "qr-camera" | "qr-demo" | "manual";
  deviceId: string;
}

export type ValidationStatus =
  | "VALID"
  | "EXPIRED"
  | "INVALID_FORMAT"
  | "WRONG_TYPE"
  | "SESSION_CLOSED"
  | "SESSION_NOT_FOUND"
  | "ALREADY_MARKED";

export interface ValidationResult {
  valid: boolean;
  status: ValidationStatus;
  payload?: QRPayload;
  errorMessage?: string;
  markedTime?: string;
  session?: AttendanceSession;
}
