"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentBrowserLocation,
  LocationSelection,
  reverseGeocode
} from "@/lib/location";

const STORAGE_KEY = "foodhub-browse-location";

const DEFAULT_BROWSE_LOCATION: LocationSelection = {
  address: "Accra, Ghana",
  city: "Accra",
  latitude: 5.56,
  longitude: -0.205
};

type BrowseLocationContextValue = {
  location: LocationSelection;
  isReady: boolean;
  isLocating: boolean;
  error: string | null;
  setLocation: (location: LocationSelection) => void;
  useCurrentLocation: () => Promise<void>;
  clearError: () => void;
};

const BrowseLocationContext = createContext<BrowseLocationContextValue | undefined>(undefined);

export function BrowseLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationSelection>(DEFAULT_BROWSE_LOCATION);
  const [isReady, setIsReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LocationSelection;
        if (
          parsed
          && typeof parsed.address === "string"
          && typeof parsed.city === "string"
          && typeof parsed.latitude === "number"
          && typeof parsed.longitude === "number"
        ) {
          setLocationState(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  function persistLocation(nextLocation: LocationSelection) {
    setLocationState(nextLocation);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLocation));
  }

  async function useCurrentLocation() {
    try {
      setIsLocating(true);
      setError(null);
      const currentLocation = await getCurrentBrowserLocation();
      const resolved = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
      persistLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: resolved.address,
        city: resolved.city
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to access your current location");
    } finally {
      setIsLocating(false);
    }
  }

  const value = useMemo<BrowseLocationContextValue>(() => ({
    location,
    isReady,
    isLocating,
    error,
    setLocation(nextLocation) {
      setError(null);
      persistLocation(nextLocation);
    },
    useCurrentLocation,
    clearError() {
      setError(null);
    }
  }), [error, isLocating, isReady, location]);

  return (
    <BrowseLocationContext.Provider value={value}>
      {children}
    </BrowseLocationContext.Provider>
  );
}

export function useBrowseLocation() {
  const context = useContext(BrowseLocationContext);
  if (!context) {
    throw new Error("useBrowseLocation must be used within BrowseLocationProvider");
  }
  return context;
}
