// lib/qr/qrValidator.ts
// ─────────────────────────────────────────────────────────────────────
// QR Code Validation Pipeline
// ─────────────────────────────────────────────────────────────────────
import { QRPayload, ValidationResult } from "./qrTypes";
import { getSessionById, getStudentAttendanceForSession } from "./qrStorage";

const EXPIRATION_GRACE_SECONDS = 5; // 5 second grace period for network/clock skew

/** Validate a raw QR string scanned from camera or demo */
export function validateScannedQR(
  qrText: string,
  studentId: string
): ValidationResult {
  if (!qrText || typeof qrText !== "string") {
    return {
      valid: false,
      status: "INVALID_FORMAT",
      errorMessage: "Invalid QR code format. Not a ZCOER attendance code.",
    };
  }

  // Step 1: Parse JSON
  let payload: QRPayload;
  try {
    payload = JSON.parse(qrText.trim());
  } catch {
    return {
      valid: false,
      status: "INVALID_FORMAT",
      errorMessage: "This QR code isn't a ZCOER attendance code.",
    };
  }

  // Step 2: Validate payload structure
  if (
    !payload ||
    payload.type !== "ZCOER_ATTENDANCE" ||
    !payload.sessionId ||
    !payload.subject ||
    !payload.expiresAt
  ) {
    return {
      valid: false,
      status: "WRONG_TYPE",
      errorMessage: "This QR code is not recognized as a valid ZCOER lecture code.",
    };
  }

  // Step 3: Check Session in Storage
  const session = getSessionById(payload.sessionId);
  const normalizedSession = session || {
    sessionId: payload.sessionId,
    subjectId: payload.subjectId,
    subject: payload.subject,
    teacherId: payload.teacherId || "teacher",
    room: payload.room || "Classroom",
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt,
    status: "active" as const,
    activeTokenCreatedAt: payload.createdAt,
    activeTokenExpiresAt: payload.expiresAt,
    tokenIndex: payload.tokenIndex || 1,
    attendance: [],
  };

  if (!session && payload.sessionId) {
    // Accept the QR as valid if the payload itself is structurally sound and not expired.
    // This prevents false "session not found" rejections when the teacher session was
    // generated in a different browser or the local session cache is stale.
  }

  if (session?.status === "closed") {
    return {
      valid: false,
      status: "SESSION_CLOSED",
      payload,
      session,
      errorMessage: "Attendance for this lecture is no longer available. Session has been closed by the teacher.",
    };
  }

  // Step 4: Check Expiry of the 30-second token
  const now = Math.floor(Date.now() / 1000);
  if (now > payload.expiresAt + EXPIRATION_GRACE_SECONDS) {
    return {
      valid: false,
      status: "EXPIRED",
      payload,
      session: normalizedSession,
      errorMessage: "This code has expired — ask your teacher to show the current screen.",
    };
  }

  // Step 5: Check Duplicate Attendance
  const existingRecord = getStudentAttendanceForSession(studentId, payload.sessionId);
  if (existingRecord && existingRecord.status === "present") {
    const d = new Date(existingRecord.markedAt * 1000);
    const markedTime = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return {
      valid: false,
      status: "ALREADY_MARKED",
      payload,
      session: normalizedSession,
      markedTime,
      errorMessage: `Your attendance for ${payload.subject} has already been recorded at ${markedTime}.`,
    };
  }

  // All checks passed!
  return {
    valid: true,
    status: "VALID",
    payload,
    session: normalizedSession,
  };
}
