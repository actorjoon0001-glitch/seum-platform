import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildLab — 건축 상담·견적 플랫폼",
  description:
    "건축회사·이동식주택·전원주택·인테리어 업체를 위한 상담/견적/3D설계/계약/시공 관리 SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
