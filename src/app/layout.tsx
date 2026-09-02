import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Helper",
  description: "A private research paper writing workspace",
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
