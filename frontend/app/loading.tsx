import { RouteLoader } from "@/components/RouteLoader";
import { APP_NAME } from "@/lib/brand";

export default function Loading() {
  return (
    <RouteLoader
      title={`Loading ${APP_NAME}`}
      message="Your next page is on the way."
    />
  );
}
