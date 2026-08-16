import type { Metadata, Viewport } from "next";
import { Prompt, Sarabun } from "next/font/google";
import { DbInit } from "@/components/DbInit";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "เงินทองของเรา — เครื่องมือวางแผนการเงิน",
  description: "เพื่อนช่วยวางแผนการเงินส่วนตัว: สินทรัพย์ หนี้สิน กระแสเงินสด และเป้าหมาย",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "เงินทองของเรา",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFF8F1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${prompt.variable} ${sarabun.variable}`}>
      <body>
        <DbInit />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
