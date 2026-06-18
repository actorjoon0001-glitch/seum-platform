"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // 여러 서비스를 탭처럼 동시에 열어두고 전환한다.
  // 열린 탭의 iframe은 계속 마운트되어 전환해도 상태가 유지된다.
  const [openTabs, setOpenTabs] = useState<SystemCard[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // 오버레이 안에서 다른 시스템을 추가로 열기 위한 "+ 시스템" 메뉴
  const [adderOpen, setAdderOpen] = useState(false);

  // popstate 핸들러에서 최신 열린 탭 목록을 읽기 위한 ref
  const openTabsRef = useRef(openTabs);
  openTabsRef.current = openTabs;

  // 탭을 열거나 전환할 때마다 브라우저 히스토리에 항목을 쌓는다.
  // → 브라우저 뒤로/앞으로가 곧 탭 전환이 된다.
  const activate = useCallback((key: string) => {
    setActiveKey(key);
    window.history.pushState(
      { ...(window.history.state as object | null), seumTab: key },
      "",
    );
  }, []);

  const openService = (s: SystemCard) => {
    setOpenTabs((prev) => (prev.some((p) => p.key === s.key) ? prev : [...prev, s]));
    activate(s.key);
  };

  const closeTab = useCallback((key: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((p) => p.key !== key);
      setActiveKey((curr) =>
        curr !== key ? curr : next.length ? next[next.length - 1].key : null,
      );
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenTabs([]);
    setActiveKey(null);
  }, []);

  const overlayOpen = openTabs.length > 0;

  // 브라우저 뒤로/앞으로 = 탭 전환. 탭은 닫지 않는다(✕/전체 닫기로만 제거).
  // 오버레이가 열리기 이전 히스토리(seumTab 없음)로 나가면 오버레이를 닫는다.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const key = (e.state as { seumTab?: string } | null)?.seumTab ?? null;
      if (key === null) {
        setOpenTabs([]);
        setActiveKey(null);
        return;
      }
      // 아직 열려 있는 탭이면 전환, 닫힌 탭 항목이면 무시
      if (openTabsRef.current.some((t) => t.key === key)) setActiveKey(key);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 오버레이가 열린 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!overlayOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [overlayOpen]);

  const activeTab = openTabs.find((t) => t.key === activeKey) ?? null;
  // "+ 시스템" 메뉴에 띄울 연결된 시스템 목록
  const addable = systems.filter((s) => s.ready && s.serviceUrl);

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

          // 연결된(ready) 서비스 → 탭 오버레이로 열기
          // 준비중 → 기존 내부 안내 페이지로 이동
          return s.ready && s.serviceUrl ? (
            <button key={s.key} type="button" onClick={() => openService(s)} className={`${cardClass} w-full`}>
              {inner}
            </button>
          ) : (
            <Link key={s.key} href={s.href} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>

      {/* 전체화면 탭 오버레이 (헤더까지 덮음 · 여러 서비스 전환) */}
      {openTabs.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.key}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                    tab.key === activeKey
                      ? "border-seum-300 bg-white font-semibold text-neutral-900 shadow-sm"
                      : "border-transparent text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => activate(tab.key)}
                    className="flex items-center gap-1.5"
                  >
                    <Icon name={tab.icon} size={14} />
                    {tab.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeTab(tab.key)}
                    aria-label={`${tab.label} 닫기`}
                    className="text-neutral-400 transition hover:text-neutral-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* + 시스템 추가 — 스크롤 영역 밖에 둬야 드롭다운이 잘리지 않음 */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setAdderOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-500 transition hover:border-seum-300 hover:text-seum-600"
              >
                <Icon name="grid" size={14} /> 시스템 추가
              </button>
              {adderOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    onClick={() => setAdderOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 max-h-80 w-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    {addable.map((s) => {
                      const opened = openTabs.some((t) => t.key === s.key);
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => {
                            openService(s);
                            setAdderOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-neutral-50"
                        >
                          <Icon name={s.icon} size={16} className="text-neutral-500" />
                          <span className="flex-1 text-neutral-800">{s.label}</span>
                          {opened && <span className="text-xs text-seum-600">열림</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {activeTab?.serviceUrl && (
              <a
                href={activeTab.serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 transition hover:border-seum-300 hover:text-seum-600"
              >
                <Icon name="expand" size={13} /> 새 탭
              </a>
            )}
            <button
              type="button"
              onClick={closeAll}
              className="flex shrink-0 items-center gap-1 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700"
            >
              <Icon name="logout" size={13} /> 전체 닫기
            </button>
          </div>

          {/* 열린 탭들의 iframe — 모두 마운트 유지(전환해도 상태 보존), 활성 탭만 표시 */}
          <div className="relative flex-1">
            {openTabs.map((tab) => (
              <iframe
                key={tab.key}
                src={tab.serviceUrl}
                title={tab.label}
                className={`absolute inset-0 h-full w-full ${tab.key === activeKey ? "block" : "hidden"}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
