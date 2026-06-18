"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { useRole } from "./PortalProvider";
import { launcherSystems } from "../config/systems";
import type { SystemCard, Tone } from "../config/systems";

const TONE: Record<Tone, { box: string; hoverIcon: string; ring: string }> = {
  green: { box: "bg-seum-50 text-seum-600", hoverIcon: "group-hover:bg-seum-500", ring: "group-hover:ring-seum-200" },
  blue: { box: "bg-blue-50 text-blue-600", hoverIcon: "group-hover:bg-blue-500", ring: "group-hover:ring-blue-200" },
  indigo: { box: "bg-indigo-50 text-indigo-600", hoverIcon: "group-hover:bg-indigo-500", ring: "group-hover:ring-indigo-200" },
  amber: { box: "bg-amber-50 text-amber-600", hoverIcon: "group-hover:bg-amber-500", ring: "group-hover:ring-amber-200" },
  violet: { box: "bg-violet-50 text-violet-600", hoverIcon: "group-hover:bg-violet-500", ring: "group-hover:ring-violet-200" },
  cyan: { box: "bg-cyan-50 text-cyan-600", hoverIcon: "group-hover:bg-cyan-500", ring: "group-hover:ring-cyan-200" },
  rose: { box: "bg-rose-50 text-rose-600", hoverIcon: "group-hover:bg-rose-500", ring: "group-hover:ring-rose-200" },
  teal: { box: "bg-teal-50 text-teal-600", hoverIcon: "group-hover:bg-teal-500", ring: "group-hover:ring-teal-200" },
  slate: { box: "bg-slate-100 text-slate-600", hoverIcon: "group-hover:bg-slate-500", ring: "group-hover:ring-slate-200" },
};

/** 자주 사용하는 시스템 — 업무 시스템 런처 (메인 최상단 우선 영역) */
export function SystemLauncher() {
  const { role } = useRole();
  const systems = launcherSystems(role);
  // 연결된 서비스는 화면 전체를 덮는 오버레이로 임베드한다.
  const [active, setActive] = useState<SystemCard | null>(null);

  // 오버레이가 열려 있는 동안 배경 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="grid" size={20} className="text-seum-600" />
        <h2 className="text-base font-bold text-neutral-900">자주 사용하는 시스템</h2>
        <span className="text-xs text-neutral-400">바로가기로 업무 시스템에 빠르게 진입하세요</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((s) => {
          const t = TONE[s.tone];
          const cardClass = `group flex items-center gap-4 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
            s.featured
              ? "border-seum-200 bg-seum-50/50 ring-1 ring-seum-100"
              : "border-neutral-200 bg-white hover:border-seum-200"
          }`;
          const inner = (
            <>
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-4 ring-transparent transition ${t.box} ${t.hoverIcon} ${t.ring} group-hover:text-white`}
              >
                <Icon name={s.icon} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-bold text-neutral-900">
                  {s.label}
                  {s.featured && (
                    <span className="rounded bg-seum-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      통합
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">{s.desc}</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-neutral-300 transition group-hover:text-seum-600">
                바로가기
                <Icon name="arrow" size={14} />
              </span>
            </>
          );

          // 연결된(ready) 서비스 → 전체화면 오버레이로 임베드
          // 준비중 → 기존 내부 안내 페이지로 이동
          return s.ready && s.serviceUrl ? (
            <button key={s.key} type="button" onClick={() => setActive(s)} className={`${cardClass} w-full`}>
              {inner}
            </button>
          ) : (
            <Link key={s.key} href={s.href} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>

      {/* 전체화면 임베드 오버레이 (헤더까지 모두 덮음) */}
      {active && active.serviceUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2.5">
            <Icon name={active.icon} size={18} className="text-seum-600" />
            <span className="font-bold text-neutral-900">{active.label}</span>
            <a
              href={active.serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 transition hover:border-seum-300 hover:text-seum-600"
            >
              <Icon name="expand" size={13} /> 새 탭으로 열기
            </a>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="flex items-center gap-1 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700"
            >
              <Icon name="logout" size={13} /> 닫기
            </button>
          </div>
          <iframe src={active.serviceUrl} title={active.label} className="w-full flex-1" />
        </div>
      )}
    </section>
  );
}
