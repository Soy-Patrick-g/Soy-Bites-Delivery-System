import Image from "next/image";
import Link from "next/link";
import { formatCurrency, getRestaurant } from "@/lib/api";

type RestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">{restaurant.cuisine}</p>
          <h1 className="mt-3 font-serif text-5xl text-ink">{restaurant.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/72">{restaurant.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink/70">
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">{restaurant.address}</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">
              {restaurant.distanceKm?.toFixed(1)} km away
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-soft">
              {formatCurrency(restaurant.estimatedDeliveryFee ?? 0)} delivery
            </span>
          </div>
        </div>

        <div className="rounded-[32px] bg-ink p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.18em] text-cream/60">Customer signal</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-cream/70">Average rating</p>
              <h2 className="mt-3 text-4xl font-semibold">{restaurant.averageRating.toFixed(1)}</h2>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-cream/70">Reviews</p>
              <h2 className="mt-3 text-4xl font-semibold">{restaurant.reviews.length}</h2>
            </div>
          </div>
          <Link
            href={`/checkout?restaurant=${restaurant.id}`}
            className="mt-6 inline-flex rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-ink"
          >
            Continue to checkout
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="font-serif text-3xl text-ink">Menu highlights</h2>
          <div className="mt-6 space-y-5">
            {restaurant.menu.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-soft">
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  <div className="relative min-h-[200px]">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-cream" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-ink">{item.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-ink/72">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-citrus/25 px-4 py-2 text-sm font-semibold text-ink">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-3 text-xs uppercase tracking-[0.16em] text-olive">
                      {item.vegetarian ? <span>Vegetarian</span> : <span>Protein-rich</span>}
                      {item.spicy ? <span>Hot</span> : <span>Mild</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-3xl text-ink">Guest reviews</h2>
          <div className="mt-6 space-y-4">
            {restaurant.reviews.map((review) => (
              <article key={review.id} className="rounded-[28px] border border-ink/10 bg-white/90 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-ink">{review.customerName}</h3>
                  <span className="rounded-full bg-olive/10 px-3 py-1 text-sm text-olive">
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/70">{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
