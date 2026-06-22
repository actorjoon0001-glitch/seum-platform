"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ROLE } from "../config/roles";
import type { Role } from "../config/roles";
import type { SystemCard } from "../config/systems";
import { PortalChrome } from "./PortalChrome";
import { SystemTabsOverlay } from "./SystemTabsOverlay";

/* ── 역할(권한) 컨텍스트 ── */
interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}
const RoleContext = createContext<RoleCtx | null>(null);
export function useRole(): RoleCtx {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within PortalProvider");
  return ctx;
}

/* ── 시스템 탭(전체화면 멀티탭) 컨텍스트 ── */
interface SystemsCtx {
  openTabs: SystemCard[];
  activeKey: string | null;
  openService: (s: SystemCard) => void;
  activate: (key: string) => void;
  closeTab: (key: string) => void;
  closeAll: () => void;
}
const SystemsContext = createContext<SystemsCtx | null>(null);
export function useSystems(): SystemsCtx {
  const ctx = useContext(SystemsContext);
  if (!ctx) throw new Error("useSystems must be used within PortalProvider");
  return ctx;
}

/**
 * 포털 셸 + 역할/시스템 컨텍스트.
 * - 역할 스위처로 권한별 메뉴 노출을 미리본다(인증 전 임시).
 * - 시스템 탭 상태를 전역으로 들고 있어, 메인 런처와 상단 바 어디서든
 *   시스템을 전체화면 탭으로 열 수 있다. 오버레이는 여기서 한 번만 렌더한다.
 */
export function PortalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(DEFAULT_ROLE);

  const [openTabs, setOpenTabs] = useState<SystemCard[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const openTabsRef = useRef(openTabs);
  openTabsRef.current = openTabs;

  // 탭을 열거나 전환할 때마다 히스토리 항목을 쌓는다 → 뒤로/앞으로 = 탭 전환
  const activate = useCallback((key: string) => {
    setActiveKey(key);
    window.history.pushState(
      { ...(window.history.state as object | null), seumTab: key },
      "",
    );
  }, []);

  const openService = useCallback(
    (s: SystemCard) => {
      setOpenTabs((prev) => (prev.some((p) => p.key === s.key) ? prev : [...prev, s]));
      activate(s.key);
    },
    [activate],
  );

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

  // 브라우저 뒤로/앞으로 = 탭 전환. 오버레이 이전 히스토리로 나가면 닫기.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const key = (e.state as { seumTab?: string } | null)?.seumTab ?? null;
      if (key === null) {
        setOpenTabs([]);
        setActiveKey(null);
        return;
      }
      if (openTabsRef.current.some((t) => t.key === key)) setActiveKey(key);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 오버레이가 열린 동안 배경 스크롤 잠금
  useEffect(() => {
    if (openTabs.length === 0) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [openTabs.length]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <SystemsContext.Provider
        value={{ openTabs, activeKey, openService, activate, closeTab, closeAll }}
      >
        <div className="min-h-screen bg-[#eef2ef] text-neutral-800">
          <PortalChrome />
          <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-6">{children}</main>
        </div>
        <SystemTabsOverlay />
      </SystemsContext.Provider>
    </RoleContext.Provider>
  );
}
