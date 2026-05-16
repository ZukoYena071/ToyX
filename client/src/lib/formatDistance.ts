export function formatDistanceAway(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) return null;
  if (distanceKm < 1) return "< 1 km away";
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  if (distanceKm < 100) return `${Math.round(distanceKm)} km away`;
  return "100+ km away";
}
