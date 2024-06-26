export function isInGeofence(
  checkPoint: {latitude: number; longitude: number},
  centerPoint: {latitude: number; longitude: number},
  radius: number,
) {
  const ky = 40000 / 360;
  const kx = Math.cos((Math.PI * centerPoint.latitude) / 180.0) * ky;
  const dx = Math.abs(centerPoint.longitude - checkPoint.longitude) * kx;
  const dy = Math.abs(centerPoint.latitude - checkPoint.latitude) * ky;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}
