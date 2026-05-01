import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. 设置 Viewport 和主题色 (PWA 的顶部沉浸式状态栏靠这个)
export const viewport: Viewport = {
  themeColor: "#8E7558",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // 阻止双击放大，让体验更像 App
  userScalable: false,
};

// 2. 注入 PWA 的 Manifest 和苹果特有的全屏 Meta 标签
export const metadata: Metadata = {
  title: "Sugar Ultra | 奶茶记录",
  description: "你的专属奶茶记录与自律管家",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sugar Ultra",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}