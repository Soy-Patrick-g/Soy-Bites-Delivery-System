"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { formatCurrency } from "@/lib/api";
import type { MapStop } from "@/components/LocationMap";

type LocationMapClientProps = {
  restaurants: MapStop[];
  deliveryPoint?: MapStop;
  heightClassName?: string;
};

const ACCRA_CENTER: [number, number] = [5.6037, -0.187];

export function LocationMapClient({
  restaurants,
  deliveryPoint,
  heightClassName = "h-[360px]"
}: LocationMapClientProps) {
  const allPoints = [
    ...restaurants.map((point) => [point.latitude, point.longitude] as [number, number]),
    ...(deliveryPoint ? [[deliveryPoint.latitude, deliveryPoint.longitude] as [number, number]] : [])
  ];

  return (
    <div className={`overflow-hidden rounded-[28px] border border-ink/10 ${heightClassName}`}>
      <MapContainer center={allPoints[0] ?? ACCRA_CENTER} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPoints.length ? <FitToPoints points={allPoints} /> : null}

        {restaurants.map((restaurant) => (
          <CircleMarker
            key={restaurant.id}
            center={[restaurant.latitude, restaurant.longitude]}
            radius={10}
            pathOptions={{ color: "#5e6b2d", fillColor: "#eeb736", fillOpacity: 0.95, weight: 2 }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{restaurant.label}</p>
                {restaurant.address ? <p>{restaurant.address}</p> : null}
                {restaurant.distanceKm != null ? <p>{restaurant.distanceKm.toFixed(1)} km away</p> : null}
                {restaurant.estimatedDeliveryFee != null ? <p>Delivery fee {formatCurrency(restaurant.estimatedDeliveryFee)}</p> : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {deliveryPoint ? (
          <CircleMarker
            center={[deliveryPoint.latitude, deliveryPoint.longitude]}
            radius={10}
            pathOptions={{ color: "#ab3c27", fillColor: "#ab3c27", fillOpacity: 0.95, weight: 2 }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{deliveryPoint.label}</p>
                {deliveryPoint.address ? <p>{deliveryPoint.address}</p> : null}
              </div>
            </Popup>
          </CircleMarker>
        ) : null}

        {deliveryPoint
          ? restaurants.map((restaurant) => (
              <Polyline
                key={`route-${restaurant.id}`}
                positions={[
                  [restaurant.latitude, restaurant.longitude],
                  [deliveryPoint.latitude, deliveryPoint.longitude]
                ]}
                pathOptions={{ color: "#ab3c27", dashArray: "8 8", weight: 3, opacity: 0.7 }}
              />
            ))
          : null}
      </MapContainer>
    </div>
  );
}

function FitToPoints({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [32, 32] });
    }
  }, [map, points]);

  return null;
}
