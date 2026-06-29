import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "TrendScope — 一站式视频生成平台",
  description: "热榜发现 → AI 改写 → 视频生成 → 多平台发布",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}