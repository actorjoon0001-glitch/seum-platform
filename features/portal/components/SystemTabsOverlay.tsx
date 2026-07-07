"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { useRole, useSystems } from "./PortalProvider";
import { launcherSystems } from "../config/systems";

/**
 * 전체화면 시스템 탭 오버레이 (헤더까지 덮음).
 * 여러 시스템을 탭으로 열어두고 전환한다. 상태는 PortalProvider(전역)에서 관리.
 */
export function SystemTabsOverlay() {
  const { role } = useRole();
  const { openTabs, activeKey, activate, openService, closeTab, closeAll } = useSystems();
  const [adderOpen, setAdderOpen] = useState(false);

  if (openTabs.length === 0) return null;

  const activeTab = openTabs.find((t) => t.key === activeKey) ?? null;
  const addable = launcherSystems(role).filter((s) => s.ready && s.serviceUrl);

  return (
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
                  const rowClass =
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-neutral-50";
                  const inner = (
                    <>
                      <Icon name={s.icon} size={16} className="text-neutral-500" />
                      <span className="flex-1 text-neutral-800">{s.label}</span>
                      {s.openInNewTab ? (
                        <span className="text-xs text-neutral-400">새 탭</span>
                      ) : (
                        opened && <span className="text-xs text-seum-600">열림</span>
                      )}
                    </>
                  );
                  // openInNewTab → 임베드 대신 새 탭으로 열기
                  if (s.openInNewTab && s.serviceUrl) {
                    return (
                      <a
                        key={s.key}
                        href={s.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setAdderOpen(false)}
                        className={rowClass}
                      >
                        {inner}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        openService(s);
                        setAdderOpen(false);
                      }}
                      className={rowClass}
                    >
                      {inner}
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
  );
}
