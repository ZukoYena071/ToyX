import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
        loading: false,
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = "Unable to retrieve location";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    };

    const geoOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  const requestLocation = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported",
        loading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return {
    ...state,
    requestLocation,
  };
}

// Helper function to calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "miles" | "kilometers" = "miles"
): number {
  const R = unit === "miles" ? 3959 : 6371; // Earth's radius in miles or kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to get approximate location from coordinates
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Using a simple reverse geocoding approach based on known Bay Area coordinates
    const bayAreaLocations = [
      { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
      { name: "Oakland, CA", lat: 37.8044, lng: -122.2712 },
      { name: "Berkeley, CA", lat: 37.8715, lng: -122.2730 },
      { name: "San Jose, CA", lat: 37.3382, lng: -121.8863 },
      { name: "Palo Alto, CA", lat: 37.4419, lng: -122.1430 },
    ];

    let closest = bayAreaLocations[0];
    let minDistance = calculateDistance(lat, lng, closest.lat, closest.lng);

    for (const location of bayAreaLocations.slice(1)) {
      const distance = calculateDistance(lat, lng, location.lat, location.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = location;
      }
    }

    return closest.name;
  } catch (error) {
    return "Unknown Location";
  }
}