import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: { default: "SentinelOps Incident Lab", template: "%s · SentinelOps" },
  description:
    "Learn incident response and observability through safe, realistic simulations.",
  openGraph: {
    title: "SentinelOps Incident Lab",
    description:
      "Learn incident response and observability through safe, realistic simulations.",
    type: "website",
    siteName: "SentinelOps Incident Lab",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
