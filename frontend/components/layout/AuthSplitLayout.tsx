import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  leftContent?: ReactNode;
  children: ReactNode;
};

export function AuthSplitLayout({
  eyebrow,
  title,
  description,
  leftContent,
  children
}: AuthSplitLayoutProps) {
  return (
    <main className="app-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] bg-luxury p-8 text-cream shadow-soft">
          <p className="text-sm uppercase tracking-[0.22em] text-citrus">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-5xl">{title}</h1>
          <p className="mt-5 text-sm leading-7 text-cream/72">{description}</p>
          {leftContent ? <div className="mt-8 space-y-4 text-sm">{leftContent}</div> : null}
        </section>

        <section className="surface-card p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
