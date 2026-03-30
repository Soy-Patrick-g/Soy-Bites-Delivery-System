import Link from "next/link";
import { HelpIcon, HomeIcon, InfoIcon, InstagramIcon, LinkedInIcon, MailIcon, ShieldIcon, XSocialIcon } from "@/components/icons";

const quickLinks = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/contact", label: "Contact", icon: MailIcon },
  { href: "/faq", label: "FAQ", icon: HelpIcon }
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" }
];

const socialChannels = [
  { label: "Instagram", icon: InstagramIcon },
  { label: "X", icon: XSocialIcon },
  { label: "LinkedIn", icon: LinkedInIcon }
];

export function Footer() {
  return (
    <footer className="mt-16">
      <div className="app-shell">
        <div
          className="overflow-hidden rounded-[36px] border shadow-soft backdrop-blur-xl"
          style={{
            borderColor: "rgb(var(--color-line) / 0.22)",
            backgroundColor: "rgb(var(--color-surface) / 0.94)"
          }}
        >
          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-10">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.22em] text-ink dark:text-cream">FoodHub</p>
              <p className="mt-4 max-w-md text-sm leading-7 text-ink/72 dark:text-cream/78">
                Thoughtful food delivery for customers, restaurants, riders, and operators who want a dependable platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {socialChannels.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={{
                      borderColor: "rgb(var(--color-line) / 0.16)",
                      backgroundColor: "rgb(var(--color-luxury) / 0.04)",
                      color: "rgb(var(--color-muted))"
                    }}
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-citrus">Quick links</p>
              <div className="mt-4 grid gap-3">
                {quickLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex items-center gap-3 text-sm text-ink/76 transition hover:text-ink dark:text-cream/80 dark:hover:text-cream"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-citrus">Terms & policies</p>
              <div className="mt-4 grid gap-3">
                {legalLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex items-center gap-3 text-sm text-ink/76 transition hover:text-ink dark:text-cream/80 dark:hover:text-cream"
                  >
                    <ShieldIcon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-3 border-t px-6 py-4 text-sm sm:px-8 sm:flex-row sm:items-center sm:justify-between lg:px-10"
            style={{
              borderColor: "rgb(var(--color-line) / 0.14)",
              backgroundColor: "rgb(var(--color-luxury) / 0.03)",
              color: "rgb(var(--color-muted))"
            }}
          >
            <p>&copy; {new Date().getFullYear()} FoodHub. All rights reserved.</p>
            <p>Built for secure ordering, reliable fulfillment, and polished customer experiences.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
