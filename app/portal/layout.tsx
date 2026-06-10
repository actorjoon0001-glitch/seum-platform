import type { Metadata } from "next";
import { PortalProvider } from "@/features/portal/components/PortalProvider";

export const metadata: Metadata = {
  title: "세움 플랫폼 — 통합 업무 포털",
  description:
    "건축 플랫폼 통합 업무 포털. Call·계약·카탈로그·설계·시공·정산을 하나의 대시보드에서.",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalProvider>{children}</PortalProvider>;
}
