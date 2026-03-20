"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { addRestaurantReview } from "@/lib/api";

type OrderReviewPanelProps = {
  orderId: number;
  orderStatus: string;
  restaurantName: string;
  reviewed: boolean;
};

export function OrderReviewPanel({ orderId, orderStatus, restaurantName, reviewed }: OrderReviewPanelProps) {
  const { isReady, session } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(reviewed);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setError("Login is required before you can leave a review.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addRestaurantReview(session.token, {
        orderId,
        rating,
        comment: comment.trim() || undefined
      });
      setIsDone(true);
      setComment("");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderStatus !== "DELIVERED") {
    return (
      <section id="review" className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Review this restaurant</h2>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Reviews unlock after the order is marked delivered. Come back once your delivery is complete.
        </p>
      </section>
    );
  }

  if (!isReady) {
    return (
      <section id="review" className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
        <p className="text-sm text-ink/70">Preparing review form...</p>
      </section>
    );
  }

  if (!session || session.role !== "USER") {
    return (
      <section id="review" className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Review this restaurant</h2>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Sign in with the customer account that placed this order to leave a review for {restaurantName}.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`}
          className="mt-6 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white"
        >
          Login to review
        </Link>
      </section>
    );
  }

  if (isDone) {
    return (
      <section id="review" className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">Review submitted</h2>
        <p className="mt-4 text-sm leading-7 text-ink/70">
          Thanks for sharing feedback about {restaurantName}. Your review now contributes to that restaurant’s rating.
        </p>
      </section>
    );
  }

  return (
    <section id="review" className="rounded-[32px] border border-ink/10 bg-white/90 p-8 shadow-soft">
      <h2 className="text-2xl font-semibold text-ink">Review {restaurantName}</h2>
      <p className="mt-3 text-sm leading-7 text-ink/70">
        Your order is delivered, so you can now rate the food and service for this restaurant.
      </p>

      {error ? <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive">Rating</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  rating === value ? "bg-citrus text-ink" : "border border-ink/15 bg-white text-ink"
                }`}
              >
                {value} star{value === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-olive">Comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="What stood out about the food, packaging, or delivery?"
            className="mt-3 w-full rounded-[24px] border border-ink/10 bg-cream px-4 py-4 text-sm text-ink outline-none transition focus:border-olive"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </section>
  );
}
