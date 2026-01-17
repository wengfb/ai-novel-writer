import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 小说家 - 沉浸式创作工坊",
  description: "为小说家打造的 AI 智能副驾驶创作平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased h-full overflow-hidden bg-background text-foreground"
        )}
      >
        {children}
      </body>
    </html>
  );
}