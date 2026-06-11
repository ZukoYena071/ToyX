export function formatLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const parts = location.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  // Prefer City + Province (parts[0] and parts[1])
  // Skip municipality, postal code, country
  const city = parts[0];
  // Find the first part that looks like a province/state (not a municipality, not a number)
  const province = parts.slice(1).find(p => !/^\d+$/.test(p) && p.length < 30 && !p.toLowerCase().includes("metropolitan") && !p.toLowerCase().includes("municipal"));
  if (province) return `${city}, ${province}`;
  return city;
}
