import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeWrap } from "@/components/ThemeWrap";
import { Toast } from "@/components/Toast";

export const metadata: Metadata = { title: "Rooms", description: "Private messenger", manifest: "/manifest.json" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#0f172a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full">
        <ThemeWrap>
          <div className="h-full bg-bg text-tx">{children}</div>
          <Toast />
        </ThemeWrap>
      </body>
    </html>
  );
}
