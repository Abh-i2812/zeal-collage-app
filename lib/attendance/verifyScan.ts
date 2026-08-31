// lib/attendance/verifyScan.ts
// ─────────────────────────────────────────────────────────────────────
// Anti-Proxy Verification Pipeline matching Section 6
// ─────────────────────────────────────────────────────────────────────
import { calculateHaversineDistance } from "@/lib/geo/haversine";

export interface VerifyScanRequest {
  sessionId: string;
  token: string;
  studentId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
}

export interface VerifyScanResult {
  success: boolean;
  status: "present" | "rejected";
  rejectReason?: string;
  distanceM?: number;
  deviceMatch?: boolean;
}

/**
 * Execute the 5-step Anti-Proxy Verification Pipeline
 */
export function processVerification(
  req: VerifyScanRequest,
  dbData: {
    session: {
      id: string;
      status: string;
      endsAt: number; // unix timestamp in sec
      classLatitude: number;
      classLongitude: number;
      geofenceRadiusM: number;
    } | null;
    token: {
      token: string;
      used: boolean;
      validFrom: number;
      validUntil: number;
    } | null;
    student: {
      id: string;
      registeredDeviceId: string | null;
    } | null;
    existingRecord: { id: string } | null;
  }
): VerifyScanResult {
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Session Active Check
  if (
    !dbData.session ||
    dbData.session.status !== "active" ||
    nowSec > dbData.session.endsAt
  ) {
    return {
      success: false,
      status: "rejected",
      rejectReason: "session closed",
      deviceMatch: false,
    };
  }

  // 2. Rotating Token Validity Check (~12s window)
  if (
    !dbData.token ||
    dbData.token.used ||
    nowSec < dbData.token.validFrom - 2 || // 2s clock skew grace
    nowSec > dbData.token.validUntil + 2
  ) {
    return {
      success: false,
      status: "rejected",
      rejectReason: "code expired",
      deviceMatch: false,
    };
  }

  // 3. Haversine Geofence Check
  const distanceM = calculateHaversineDistance(
    { latitude: req.latitude, longitude: req.longitude },
    { latitude: dbData.session.classLatitude, longitude: dbData.session.classLongitude }
  );

  if (distanceM > dbData.session.geofenceRadiusM) {
    return {
      success: false,
      status: "rejected",
      rejectReason: "outside classroom range",
      distanceM,
      deviceMatch: false,
    };
  }

  // 4. Device ID Binding Check (Auto-register on first login)
  let deviceMatch = true;
  if (dbData.student?.registeredDeviceId) {
    if (dbData.student.registeredDeviceId !== req.deviceId) {
      deviceMatch = false;
      return {
        success: false,
        status: "rejected",
        rejectReason: "device mismatch",
        distanceM,
        deviceMatch: false,
      };
    }
  }

  // 5. Duplicate Scan Check
  if (dbData.existingRecord) {
    return {
      success: false,
      status: "rejected",
      rejectReason: "already marked",
      distanceM,
      deviceMatch: true,
    };
  }

  // ALL CHECKS PASSED!
  return {
    success: true,
    status: "present",
    distanceM,
    deviceMatch: true,
  };
}
