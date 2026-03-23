"use client";

import dynamic from "next/dynamic";

export type MapStop = {
  id: string;
  label: string;
  address?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  estimatedDeliveryFee?: number | null;
};

type LocationMapProps = {
  restaurants: MapStop[];
  deliveryPoint?: MapStop;
  heightClassName?: string;
};

const DynamicLocationMap = dynamic(
  () => import("@/components/LocationMapClient").then((module) => module.LocationMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="overflow-hidden rounded-[28px] border border-ink/10 bg-cream/60">
        <div className="flex h-[360px] items-center justify-center px-6 text-sm text-ink/60">
          Loading map...
        </div>
      </div>
    )
  }
);

export function LocationMap(props: LocationMapProps) {
  return <DynamicLocationMap {...props} />;
}
