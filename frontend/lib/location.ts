export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationSelection = Coordinates & {
  address: string;
  city: string;
};

export type LocationSuggestion = LocationSelection & {
  id: string;
  displayName: string;
};

export type DrivingRoute = {
  distanceKm: number;
  durationMinutes: number;
  points: [number, number][];
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string | undefined>;
};

function extractCity(parts?: Record<string, string | undefined>) {
  return parts?.city
    ?? parts?.town
    ?? parts?.village
    ?? parts?.municipality
    ?? parts?.county
    ?? "";
}

export async function searchLocationSuggestions(query: string) {
  if (!query.trim()) {
    return [] as LocationSuggestion[];
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "gh");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Address search is temporarily unavailable");
  }

  const data = await response.json() as NominatimResult[];
  return data.map((item) => ({
    id: String(item.place_id),
    displayName: item.display_name,
    address: item.display_name,
    city: extractCity(item.address),
    latitude: Number(item.lat),
    longitude: Number(item.lon)
  }));
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Unable to resolve that map point to an address");
  }

  const data = await response.json() as NominatimResult;
  return {
    address: data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    city: extractCity(data.address)
  };
}

export async function getCurrentBrowserLocation() {
  if (!("geolocation" in navigator)) {
    throw new Error("Your browser does not support live location access");
  }

  return new Promise<Coordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      () => reject(new Error("Unable to read your current location")),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
}

export async function getDrivingRoute(stops: Coordinates[]) {
  if (stops.length < 2) {
    return null as DrivingRoute | null;
  }

  const coordinates = stops.map((stop) => `${stop.longitude},${stop.latitude}`).join(";");
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${coordinates}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Route planning is temporarily unavailable");
  }

  const payload = await response.json() as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates: [number, number][] };
    }>;
  };

  const route = payload.routes?.[0];
  if (!route?.geometry?.coordinates?.length) {
    return null;
  }

  return {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    points: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude])
  };
}
