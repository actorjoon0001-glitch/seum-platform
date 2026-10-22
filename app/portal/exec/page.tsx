"use client";

import { useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile, useSystems } from "@/features/portal/components/PortalProvider";
import { findService } from "@/features/portal/config/systems";

const TABS = [
  { key: "contract", label: "전자계약서", desc: "계약 체결·수납 현황" },
  { key: "design", label: "설계팀", desc: "도면·설계 진행 현황" },
  { key: "construction", label: "시공팀", desc: "현장·공정 현황" },
] as const;

export default function ExecDashboardPage() {
  const { profile, loading } = useProfile();
  const { openService } = useSystems();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("contract");

  if (!loading && !isAdmin) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <p className="text-sm text-neutral-500">대표이사 전용 페이지입니다.</p>
      </div>
    );
  }

  const active = TABS.find((t) => t.key === tab)!;
  const sys = findService(tab);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-700 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="chart" size={22} /> 대표이사 대시보드
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">
          전자계약서 · 설계팀 · 시공팀 현황을 한곳에서 확인합니다.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-seum-500 text-white shadow-sm"
                : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        {sys && sys.serviceUrl && (
          <button
            type="button"
            onClick={() => openService(sys)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-600 transition hover:border-seum-400 hover:text-seum-600"
          >
            <Icon name="expand" size={15} />
            전체화면으로 열기
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-seum-100 text-seum-600">
            <Icon name={sys?.icon ?? "chart"} size={14} />
          </span>
          <h3 className="text-sm font-bold text-neutral-900">{active.label}</h3>
          <span className="text-xs text-neutral-400">{active.desc}</span>
        </div>
        {sys && sys.serviceUrl ? (
          <iframe
            key={sys.key}
            src={sys.serviceUrl}
            title={active.label}
            className="h-[calc(100vh-320px)] min-h-[520px] w-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <p className="py-16 text-center text-sm text-neutral-400">연결 준비중입니다.</p>
        )}
      </section>
    </div>
  );
}
