import { RestaurantDetailClient } from "@/components/RestaurantDetailClient";

type RestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  return <RestaurantDetailClient id={id} />;
}
