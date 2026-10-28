import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "เงินทองของเรา — เครื่องมือวางแผนการเงิน",
    short_name: "เงินทองของเรา",
    description: "เพื่อนช่วยวางแผนการเงินส่วนตัว: สินทรัพย์ หนี้สิน กระแสเงินสด และเป้าหมาย",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EEF3FF",
    theme_color: "#EEF3FF",
    lang: "th",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
