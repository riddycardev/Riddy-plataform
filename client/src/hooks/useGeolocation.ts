/**
 * useGeolocation Hook
 * Handles user location detection with multiple fallback strategies
 * Priority: GPS > IP Geolocation > Manual Input
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual' | 'geofence';
  timestamp: Date;
}

export interface UseGeolocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  setManualLocation: (lat: number, lon: number, city?: string, state?: string) => Promise<void>;
  clearLocation: () => void;
  isSupported: boolean;
}

// Fallback IP geolocation service (using free service)
async function getLocationFromIP(): Promise<{ latitude: number; longitude: number; city?: string; state?: string } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        state: data.region_code,
      };
    }
  } catch (error) {
    console.warn('[Geolocation] IP geolocation failed:', error);
  }
  return null;
}

// Reverse geocoding to get city/state from coordinates
async function reverseGeocode(lat: number, lon: number): Promise<{ city?: string; state?: string } | null> {
  try {
    // Using Open Street Map Nominatim (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();

    if (data.address) {
      return {
        city: data.address.city || data.address.town || data.address.village,
        state: data.address.state,
      };
    }
  } catch (error) {
    console.warn('[Geolocation] Reverse geocoding failed:', error);
  }
  return null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => 'geolocation' in navigator);
  const attemptedRef = useRef(false);
  const saveLocationMutation = trpc.geolocation.saveUserLocation.useMutation();

  // Request GPS location
  const requestGPSLocation = useCallback(async (): Promise<UserLocation | null> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Try to get city/state via reverse geocoding
          const geocoded = await reverseGeocode(latitude, longitude);

          const userLocation: UserLocation = {
            latitude,
            longitude,
            accuracy,
            city: geocoded?.city,
            state: geocoded?.state,
            source: 'gps',
            timestamp: new Date(),
          };

          setLocation(userLocation);
          setError(null);

          // Save to backend
          try {
            await saveLocationMutation.mutateAsync({
              latitude,
              longitude,
              city: geocoded?.city,
              state: geocoded?.state,
              source: 'gps',
              accuracy,
            });
          } catch (err) {
            console.warn('[Geolocation] Failed to save GPS location to backend:', err);
          }

          resolve(userLocation);
        },
        (err) => {
          console.warn('[Geolocation] GPS error:', err);
          setError(`GPS error: ${err.message}`);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [isSupported, saveLocationMutation]);

  // Request IP-based location (fallback)
  const requestIPLocation = useCallback(async (): Promise<UserLocation | null> => {
    const ipLocation = await getLocationFromIP();
    if (!ipLocation) return null;

    const userLocation: UserLocation = {
      latitude: ipLocation.latitude,
      longitude: ipLocation.longitude,
      city: ipLocation.city,
      state: ipLocation.state,
      source: 'ip',
      timestamp: new Date(),
    };

    setLocation(userLocation);
    setError(null);

    // Save to backend
    try {
      await saveLocationMutation.mutateAsync({
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
        city: ipLocation.city,
        state: ipLocation.state,
        source: 'ip',
      });
    } catch (err) {
      console.warn('[Geolocation] Failed to save IP location to backend:', err);
    }

    return userLocation;
  }, [saveLocationMutation]);

  // Main request location function with fallback chain
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try GPS first
      let result = await requestGPSLocation();

      // Fallback to IP if GPS fails
      if (!result) {
        result = await requestIPLocation();
      }

      if (!result) {
        setError('Não foi possível detectar sua localização. Por favor, digite manualmente.');
      }
    } catch (err) {
      console.error('[Geolocation] Request location error:', err);
      setError('Erro ao detectar localização');
    } finally {
      setLoading(false);
    }
  }, [requestGPSLocation, requestIPLocation]);

  // Set manual location
  const setManualLocation = useCallback(
    async (lat: number, lon: number, city?: string, state?: string) => {
      const userLocation: UserLocation = {
        latitude: lat,
        longitude: lon,
        city,
        state,
        source: 'manual',
        timestamp: new Date(),
      };

      setLocation(userLocation);
      setError(null);

      // Save to backend
      try {
        await saveLocationMutation.mutateAsync({
          latitude: lat,
          longitude: lon,
          city,
          state,
          source: 'manual',
        });
      } catch (err) {
        console.warn('[Geolocation] Failed to save manual location to backend:', err);
      }
    },
    [saveLocationMutation]
  );

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  // Auto-request location on mount (only once)
  useEffect(() => {
    if (!attemptedRef.current) {
      attemptedRef.current = true;
      // Commented out to avoid automatic location request
      // Uncomment if you want to request location on mount
      // requestLocation();
    }
  }, [requestLocation]);

  return {
    location,
    loading,
    error,
    requestLocation,
    setManualLocation,
    clearLocation,
    isSupported,
  };
}

/**
 * Hook to search vehicles by current location
 */
export function useVehiclesByLocation(location: UserLocation | null, radiusKm: number = 50) {
  const searchQuery = trpc.geolocation.searchByLocation.useQuery(
    location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm,
        }
      : (undefined as any),
    {
      enabled: !!location,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return searchQuery;
}

/**
 * Hook to get nearby cities suggestions
 */
export function useNearbyCities(location: UserLocation | null, radiusKm: number = 100) {
  const citiesQuery = trpc.geolocation.getNearbyCity.useQuery(
    location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm,
        }
      : (undefined as any),
    {
      enabled: !!location,
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  return citiesQuery;
}
