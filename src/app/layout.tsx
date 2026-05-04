import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChadGPT Admin",
    template: "%s | ChadGPT Admin",
  },
  description: "Enterprise AI Platform Administration Console",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Default `dark` matches uiStore; ThemeClassSync updates class on the client.
     * suppressHydrationWarning mitigates extension-injected attributes (e.g. Edge translate).
     */
    <html lang="en" translate="no" suppressHydrationWarning className={`${inter.variable} dark`}>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-neutral-50 dark:bg-slate-950"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
