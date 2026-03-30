"use client";

type RouteLoaderProps = {
  title?: string;
  message?: string;
  fullScreen?: boolean;
};

export function RouteLoader({
  title = "Preparing your next page",
  message = "We’re getting everything ready for you.",
  fullScreen = true
}: RouteLoaderProps) {
  return (
    <div className={fullScreen ? "app-shell flex min-h-[60vh] items-center justify-center px-4 py-16" : "flex items-center justify-center py-12"}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-[32px] border px-6 py-8 text-center shadow-soft backdrop-blur-xl sm:px-8"
        style={{
          borderColor: "rgb(var(--color-line) / 0.22)",
          backgroundColor: "rgb(var(--color-surface) / 0.9)"
        }}
      >
        <div className="mx-auto flex w-fit items-center gap-3 rounded-full px-4 py-3" style={{ backgroundColor: "rgb(var(--color-luxury) / 0.05)" }}>
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-citrus/55" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-citrus" />
          </span>
          <svg
            className="h-9 w-9 animate-spin text-ember"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeOpacity="0.14" strokeWidth="4" />
            <path d="M24 6a18 18 0 0 1 16.97 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-ink dark:text-cream">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-ink/70 dark:text-cream/76">{message}</p>

        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-citrus"
              style={{ animationDelay: `${dot * 160}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
