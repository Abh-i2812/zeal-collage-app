// lib/attendance/verifyScanV2.ts
// ─────────────────────────────────────────────────────────────────────
// Anti-Proxy v2 13-Step Verification Pipeline with Trust Scoring
// ─────────────────────────────────────────────────────────────────────
import { calculateHaversineDistance } from "@/lib/geo/haversine";
import { SignedQRPayload, verifySignedToken } from "@/lib/security/hmacToken";

export interface VerifyScanV2Request {
  sessionId: string;
  signedToken: SignedQRPayload;
  studentId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  gpsAccuracyM?: number;
  userAgent?: string;
  ipHash?: string;
}

export interface VerifyScanV2Result {
  success: boolean;
  status: "present" | "late" | "flagged" | "rejected" | "already_marked";
  reasonCode?: string;
  message: string;
  distanceM: number;
  trustScore: number;
  deviceMatch: boolean;
  retryable: boolean;
}

export function processVerificationV2(
  req: VerifyScanV2Request,
  sessionInfo: {
    status: string;
    endsAt: number; // unix sec
    lateAfterSeconds: number;
    tokenSecret: string;
    classLatitude: number;
    classLongitude: number;
    geofenceRadiusM: number;
    currentSeq: number;
  },
  registeredDeviceId: string | null,
  deviceUsedByOtherStudent: boolean,
  existingRecord: { id: string; status: string } | null
): VerifyScanV2Result {
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Session Active Check
  if (sessionInfo.status !== "active" || nowSec > sessionInfo.endsAt) {
    return {
      success: false,
      status: "rejected",
      reasonCode: "session_closed",
      message: "Attendance session is closed or expired.",
      distanceM: 0,
      trustScore: 0,
      deviceMatch: false,
      retryable: false,
    };
  }

  // 2. Duplicate Check
  if (existingRecord) {
    return {
      success: true,
      status: "already_marked",
      reasonCode: "already_marked",
      message: "Attendance already recorded for this session.",
      distanceM: 0,
      trustScore: 100,
      deviceMatch: true,
      retryable: false,
    };
  }

  // 3. HMAC Token Signature & Validity Check
  const tokenCheck = verifySignedToken(req.signedToken, sessionInfo.tokenSecret);
  if (!tokenCheck.valid) {
    return {
      success: false,
      status: "rejected",
      reasonCode: tokenCheck.reason || "token_invalid",
      message: tokenCheck.reason === "token_expired" ? "QR code expired. Please scan the current code." : "Invalid QR token.",
      distanceM: 0,
      trustScore: 0,
      deviceMatch: false,
      retryable: true,
    };
  }

  // 4. Geofence Distance Check
  const distanceM = calculateHaversineDistance(
    { latitude: req.latitude, longitude: req.longitude },
    { latitude: sessionInfo.classLatitude, longitude: sessionInfo.classLongitude }
  );

  if (distanceM > sessionInfo.geofenceRadiusM) {
    return {
      success: false,
      status: "rejected",
      reasonCode: "outside_range",
      message: `Outside classroom range (${distanceM}m away from class).`,
      distanceM,
      trustScore: 0,
      deviceMatch: false,
      retryable: true,
    };
  }

  // 5. One-Device-One-Student Rule (Device Reused Hard Reject)
  if (deviceUsedByOtherStudent) {
    return {
      success: false,
      status: "rejected",
      reasonCode: "device_reused",
      message: "This device has already scanned for another student in this session.",
      distanceM,
      trustScore: 0,
      deviceMatch: false,
      retryable: false,
    };
  }

  // 6. Device ID Binding Check
  let deviceMatch = true;
  if (registeredDeviceId && registeredDeviceId !== req.deviceId) {
    deviceMatch = false;
    return {
      success: false,
      status: "rejected",
      reasonCode: "device_mismatch",
      message: "Device mismatch. A change request has been submitted to your teacher.",
      distanceM,
      trustScore: 20,
      deviceMatch: false,
      retryable: false,
    };
  }

  // 7. Trust Score Calculation
  let trustScore = 100;
  const gpsAccuracy = req.gpsAccuracyM || 20;

  // Deductions for soft signals
  if (gpsAccuracy > 60) trustScore -= 20;
  if (req.signedToken.seq < sessionInfo.currentSeq - 1) trustScore -= 25;

  // Determine final status
  let finalStatus: "present" | "late" | "flagged" = "present";
  if (trustScore < 70) {
    finalStatus = "flagged";
  } else if (nowSec > sessionInfo.endsAt - (sessionInfo.lateAfterSeconds || 120)) {
    finalStatus = "late";
  }

  return {
    success: true,
    status: finalStatus,
    reasonCode: finalStatus === "flagged" ? "soft_signals_suspicious" : "verified",
    message: finalStatus === "flagged" ? "Marked for teacher review (Flagged)." : "Attendance verified successfully!",
    distanceM,
    trustScore,
    deviceMatch,
    retryable: false,
  };
}
