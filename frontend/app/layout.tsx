import type { Metadata } from "next";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "FoodHub | Multi-Vendor Food Delivery",
  description: "Location-aware food ordering platform with multi-vendor discovery and live order tracking."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans text-ink antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
