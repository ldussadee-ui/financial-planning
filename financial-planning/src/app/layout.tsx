import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import { DbInit } from "@/components/DbInit";
import { PwaRegister } from "@/components/PwaRegister";
import { UpdateChecker } from "@/components/UpdateChecker";
import { NetWorthSnapshotter } from "@/components/NetWorthSnapshotter";
import { RecurringGenerator } from "@/components/RecurringGenerator";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
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
  themeColor: "#EEF3FF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={kanit.variable}>
      <body>
        <DbInit />
        <PwaRegister />
        <UpdateChecker />
        <NetWorthSnapshotter />
        <RecurringGenerator />
        {children}
      </body>
    </html>
  );
}
