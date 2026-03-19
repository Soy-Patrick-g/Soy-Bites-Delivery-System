"use client";

import Link from "next/link";

type ReceiptActionsProps = {
  orderId: number;
};

export function ReceiptActions({ orderId }: ReceiptActionsProps) {
  return (
    <div className="print:hidden">
      <div className="mx-auto mb-8 flex max-w-5xl flex-wrap justify-between gap-4 px-6 pt-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-olive">Printable receipt</p>
          <h1 className="mt-2 font-serif text-4xl text-ink">Order #{orderId}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/orders/${orderId}`}
            className="rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/70"
          >
            Back to order
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            Print receipt
          </button>
        </div>
      </div>
    </div>
  );
}
