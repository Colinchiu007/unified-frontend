import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TranslationsProvider } from "@/i18n/TranslationsProvider";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "TrendScope — 一站式视频生成平台",
  description: "热榜发现 → AI 改写 → 视频生成 → 多平台发布",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrendScope",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <TranslationsProvider>
            {children}
          </TranslationsProvider>
          <PWARegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
