import type { ReactNode } from "react";

type StaticPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function StaticPageShell({ eyebrow, title, intro, children }: StaticPageShellProps) {
  return (
    <main className="app-shell py-10 sm:py-14">
      <section className="surface-card p-8 sm:p-10">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-ink/72">{intro}</p>
      </section>
      <section className="mt-8 grid gap-6">{children}</section>
    </main>
  );
}
