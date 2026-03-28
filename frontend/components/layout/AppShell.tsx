import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return <main className={cn("app-shell py-8 sm:py-12", className)}>{children}</main>;
}
