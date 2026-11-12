import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Fitness OS", template: "%s · Fitness OS" },
  description: "Nutrition, strength and body analytics",
  appleWebApp: { capable: true, title: "Fitness OS", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0a0b0d", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
