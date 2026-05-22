export interface LocationResult {
  displayName: string;
  lat: number;
  lng: number;
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (query.length < 2) return [];

  try {
    const autoRes = await fetch(`/api/location/autocomplete?input=${encodeURIComponent(query)}`);
    const autoData = await autoRes.json();
    if (autoData.predictions && autoData.predictions.length > 0) {
      const results = await Promise.all(
        autoData.predictions.slice(0, 5).map(async (p: any) => {
          const detailRes = await fetch(`/api/location/place-details?place_id=${p.place_id}`);
          const detail = await detailRes.json();
          return {
            displayName: detail.result?.formatted_address || p.description,
            lat: detail.result?.geometry?.location?.lat || 0,
            lng: detail.result?.geometry?.location?.lng || 0,
          };
        })
      );
      return results;
    }
  } catch (e) {
    console.warn("Google Places proxy failed, falling back to Nominatim", e);
  }

  // Fallback: Nominatim (OpenStreetMap) - free, no key required
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=za`,
      { headers: { "User-Agent": "ToyX/1.0" } }
    );
    const data = await res.json();
    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    console.error("Location search failed", e);
    return [];
  }
}
