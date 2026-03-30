import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.75v2.5M12 18.75v2.5M4.75 12h-2.5M21.75 12h-2.5M5.8 5.8 4.02 4.02M19.98 19.98l-1.78-1.78M18.2 5.8l1.78-1.78M5.8 18.2l-1.78 1.78" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.2 14.4A8.8 8.8 0 1 1 9.6 3.8a7.4 7.4 0 1 0 10.6 10.6Z" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3.3 2.74 5.54 6.12.89-4.43 4.32 1.05 6.1L12 17.3l-5.48 2.88 1.05-6.1L3.14 9.73l6.12-.89L12 3.3Z" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.75 7.75h3.5l1.4-2h4.7l1.4 2h3.5a1.75 1.75 0 0 1 1.75 1.75v8.75A1.75 1.75 0 0 1 19.25 20H4.75A1.75 1.75 0 0 1 3 18.25V9.5c0-.97.78-1.75 1.75-1.75Z" />
      <circle cx="12" cy="13" r="3.25" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 16.5v-9" />
      <path d="m8.5 11 3.5-3.5 3.5 3.5" />
      <path d="M4 18.75h16" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 10.75 12 4.5l7.5 6.25v8A1.75 1.75 0 0 1 17.75 20H6.25A1.75 1.75 0 0 1 4.5 18.75Z" />
      <path d="M9.5 20v-5.25h5V20" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7.25" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.35a2.58 2.58 0 0 1 4.88 1.18c0 1.76-2.1 2.28-2.1 3.75" />
      <circle cx="12" cy="17.25" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5 5 6.25v5.93c0 4.04 2.85 6.97 7 8.32 4.15-1.35 7-4.28 7-8.32V6.25L12 3.5Z" />
      <path d="m9.25 12.25 1.9 1.9 3.6-4.15" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XSocialIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5.5 4.5 18.5 19.5" />
      <path d="M18.5 4.5 5.5 19.5" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4.25" y="9.5" width="3.5" height="10.25" />
      <path d="M6 6.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" fill="currentColor" stroke="none" />
      <path d="M10.75 19.75V9.5h3.5v1.6c.7-1.1 1.82-1.85 3.35-1.85 2.35 0 3.9 1.55 3.9 4.66v5.84H18V14.5c0-1.38-.54-2.2-1.8-2.2-1.25 0-1.95.84-1.95 2.2v5.25Z" />
    </svg>
  );
}
