import type { MetadataRoute } from "next";

/** 홈화면/바탕화면 바로가기 아이콘·앱 이름 (PWA 매니페스트) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "세움 플랫폼 · 세움디자인하우징 통합 업무 포털",
    short_name: "세움 플랫폼",
    description: "세움디자인하우징 통합 업무 포털",
    start_url: "/portal",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#1a5e34",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
