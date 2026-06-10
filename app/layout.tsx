import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세움 플랫폼 — 세움디자인하우징 통합 업무 포털",
  description:
    "영업·설계·시공·정산 업무를 하나로 연결하는 세움디자인하우징 내부 통합 업무 포털.",
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
