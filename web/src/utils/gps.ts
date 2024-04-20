export function coordinateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export function getFormattedDistance(distance: number) {
  if (distance < 1000) {
    return `${distance.toFixed(0)} ${"m"}`;
  } else {
    return `${(distance / 1000).toFixed(1)} ${"km"}`;
  }
}

export function getTotalDistance(gps: { lat: number; lng: number }[]) {
  let totalDistance = 0;
  let previousCoordinateIndex = 0;
  if (gps.length > 0) {
    for (let i = 1; i < gps.length - 1; i++) {
      totalDistance += coordinateDistance(
        gps[previousCoordinateIndex].lat,
        gps[previousCoordinateIndex].lng,
        gps[i].lat,
        gps[i].lng
      );
      previousCoordinateIndex++;
    }
  }

  return totalDistance;
}
