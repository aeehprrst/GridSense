import type { Metadata } from "next";
import "./globals.css";
import { MockDataBanner } from "@/components/system/MockDataBanner";

export const metadata: Metadata = {
  title: "GridSense — AI-Powered Grid Intelligence Platform",
  description: "National electricity grid intelligence, prediction and resilience powered by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MockDataBanner />
      </body>
    </html>
  );
}
