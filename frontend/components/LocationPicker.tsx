"use client";

import { useEffect, useState } from "react";
import { LocationMap } from "@/components/LocationMap";
import {
  getCurrentBrowserLocation,
  LocationSelection,
  LocationSuggestion,
  reverseGeocode,
  searchLocationSuggestions
} from "@/lib/location";

type LocationPickerProps = {
  title: string;
  description?: string;
  value: LocationSelection;
  onChange: (location: LocationSelection) => void;
  heightClassName?: string;
};

export function LocationPicker({
  title,
  description,
  value,
  onChange,
  heightClassName = "h-[320px]"
}: LocationPickerProps) {
  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResolvingPoint, setIsResolvingPoint] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const nextSuggestions = await searchLocationSuggestions(normalizedQuery);
        if (active) {
          setSuggestions(nextSuggestions);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Unable to search locations");
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  async function applyCoordinates(latitude: number, longitude: number, fallbackAddress?: string, fallbackCity?: string) {
    try {
      setIsResolvingPoint(true);
      setError(null);
      const resolved = await reverseGeocode(latitude, longitude);
      const nextLocation = {
        latitude,
        longitude,
        address: resolved.address || fallbackAddress || value.address,
        city: resolved.city || fallbackCity || value.city
      };
      onChange(nextLocation);
      setQuery(nextLocation.address);
      setSuggestions([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to resolve the selected location");
    } finally {
      setIsResolvingPoint(false);
    }
  }

  async function handleUseCurrentLocation() {
    try {
      setError(null);
      const currentLocation = await getCurrentBrowserLocation();
      await applyCoordinates(currentLocation.latitude, currentLocation.longitude);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to access your current location");
    }
  }

  return (
    <div className="rounded-[28px] border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive">{title}</p>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void handleUseCurrentLocation()}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
        >
          Use current location
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/70">Search for an address</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search street, area, or landmark"
              className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none"
            />
          </label>

          {isSearching ? <p className="text-sm text-ink/60">Searching locations...</p> : null}

          {suggestions.length ? (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-ink/10 bg-cream p-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    onChange(suggestion);
                    setQuery(suggestion.address);
                    setSuggestions([]);
                    setError(null);
                  }}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-ink transition hover:bg-white"
                >
                  {suggestion.displayName}
                </button>
              ))}
            </div>
          ) : null}

          <div className="rounded-2xl bg-cream px-4 py-4 text-sm text-ink/75">
            <p className="font-semibold text-ink">Selected location</p>
            <p className="mt-2">{value.address || "Choose a location from the map or search results."}</p>
            <p className="mt-2">City: {value.city || "Not resolved yet"}</p>
            {isResolvingPoint ? <p className="mt-2 text-xs text-ink/60">Resolving map point...</p> : null}
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <LocationMap
              restaurants={[]}
              deliveryPoint={{
                id: "selected-location",
                label: value.address || "Selected location",
                address: value.city,
                latitude: value.latitude,
                longitude: value.longitude
              }}
              heightClassName={heightClassName}
            />
            <button
              type="button"
              onClick={() => setIsMapExpanded(true)}
              className="absolute inset-0 flex items-end justify-start rounded-[28px] bg-ink/10 p-4 text-left"
            >
              <span className="rounded-full bg-white/92 px-4 py-2 text-sm font-semibold text-ink shadow-sm">
                Open large map to choose location
              </span>
            </button>
          </div>
          <p className="text-xs text-ink/55">
            Click the map to enlarge it, then pan and zoom to the exact place you want before selecting it.
          </p>
        </div>
      </div>

      {isMapExpanded ? (
        <div className="fixed inset-0 z-50 bg-ink/65 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-[32px] bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive">Large map picker</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">Pan, zoom, and click the exact location</h3>
                <p className="mt-2 text-sm text-ink/65">
                  Move around the map freely, then click once to select the final delivery or restaurant location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
              >
                Close map
              </button>
            </div>

            <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[0.72fr_0.28fr]">
              <LocationMap
                restaurants={[]}
                deliveryPoint={{
                  id: "expanded-selected-location",
                  label: value.address || "Selected location",
                  address: value.city,
                  latitude: value.latitude,
                  longitude: value.longitude
                }}
                onMapClick={(latitude, longitude) => {
                  void applyCoordinates(latitude, longitude, value.address, value.city);
                }}
                heightClassName="h-[65vh] min-h-[420px]"
              />

              <div className="rounded-[28px] bg-cream p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-olive">Current selection</p>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {value.address || "No resolved address yet"}
                </p>
                <p className="mt-2 text-sm text-ink/65">City: {value.city || "Not resolved yet"}</p>
                {isResolvingPoint ? <p className="mt-3 text-sm text-ink/65">Resolving clicked map point...</p> : null}
                <p className="mt-5 text-sm text-ink/70">
                  Tip: zoom in close to the street or building area you want, then click once on the map.
                </p>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(false)}
                  className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream"
                >
                  Done choosing location
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
