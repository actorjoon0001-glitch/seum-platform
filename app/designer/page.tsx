"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

// Three.js는 클라이언트 전용 → SSR 비활성화
const ConsultViewer = dynamic(
  () => import("@/features/designer/viewer/ConsultViewer").then((m) => m.ConsultViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-neutral-500">
        3D 뷰어 로딩 중…
      </div>
    ),
  },
);

export default function DesignerPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex h-16 items-center justify-between border-b border-neutral-800 px-6">
        <Link href="/" className="text-lg font-bold">
          Build<span className="text-brand">Lab</span>
          <span className="ml-3 text-sm font-normal text-neutral-500">
            3D 상담 견적
          </span>
        </Link>
        <span className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs text-brand">
          상담 데모
        </span>
      </header>
      <main className="p-4">
        <ConsultViewer />
      </main>
    </div>
  );
}
