// lib/geo/haversine.ts
// ─────────────────────────────────────────────────────────────────────
// Custom Haversine Distance Formula (In meters)
// ─────────────────────────────────────────────────────────────────────

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the Haversine distance in meters between two GPS coordinates
 * @param coord1 First coordinate { latitude, longitude }
 * @param coord2 Second coordinate { latitude, longitude }
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}
