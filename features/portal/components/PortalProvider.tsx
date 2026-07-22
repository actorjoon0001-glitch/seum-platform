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
import { SYSTEMS, type SystemCard } from "../config/systems";
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

/* ── 로그인 사용자 프로필(세움OS employees) 컨텍스트 ── */
export interface EmployeeProfile {
  name: string;
  team: string | null;
  positionName: string | null;
  permission: string | null;
  showroom: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}
/** employees 테이블에서 읽는 행 (DB 타입 미생성이라 로컬 정의) */
interface EmployeeRow {
  name: string | null;
  team: string | null;
  position_name: string | null;
  permission: string | null;
  showroom: string | null;
  email: string | null;
  phone: string | null;
}
interface ProfileCtx {
  profile: EmployeeProfile | null;
  loading: boolean;
  reload: () => Promise<void>;
}
const ProfileContext = createContext<ProfileCtx | null>(null);
export function useProfile(): ProfileCtx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within PortalProvider");
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

  // 로그인 사용자의 세움OS employees 정보
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      const res = await supabase
        .from("employees")
        .select("name, team, position_name, permission, showroom, email, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      const data = res.data as EmployeeRow | null;
      // avatar_url 은 컬럼이 아직 없을 수 있어 별도로(에러 무시) 조회한다.
      let avatarUrl: string | null = null;
      const av = await supabase
        .from("employees")
        .select("avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!av.error) {
        avatarUrl = (av.data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
      }
      setProfile({
        name: data?.name ?? user.email ?? "사용자",
        team: data?.team ?? null,
        positionName: data?.position_name ?? null,
        permission: data?.permission ?? null,
        showroom: data?.showroom ?? null,
        email: data?.email ?? user.email ?? null,
        phone: data?.phone ?? null,
        avatarUrl,
      });
    } catch {
      // 인증/네트워크 오류 시 프로필 없음으로 둔다
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

  // SSO: 임베드된 시스템(iframe)이 'seum-sso:ready'를 보내면, 현재 포털 로그인
  // 세션 토큰을 그 시스템 origin으로 돌려준다 → 시스템이 재로그인 없이 자동 로그인.
  // (같은 Supabase 프로젝트를 공유하므로 토큰 전달만으로 세션 복원 가능)
  useEffect(() => {
    let removed = false;
    let cleanup = () => {};
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // 토큰을 넘겨줄 신뢰 origin = 연결된(ready) 시스템들의 origin
      const allowed = new Set(
        SYSTEMS.filter((s) => s.ready && s.serviceUrl)
          .map((s) => {
            try {
              return new URL(s.serviceUrl as string).origin;
            } catch {
              return null;
            }
          })
          .filter((o): o is string => !!o),
      );
      const onMessage = async (e: MessageEvent) => {
        if (!allowed.has(e.origin)) return; // 우리 시스템이 보낸 것만
        if ((e.data as { type?: string } | null)?.type !== "seum-sso:ready") return;
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return; // 로그인 안 돼 있으면 무시 → 시스템 자체 로그인 표시
        (e.source as Window | null)?.postMessage(
          {
            type: "seum-sso:token",
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          },
          e.origin,
        );
      };
      if (removed) return;
      window.addEventListener("message", onMessage);
      cleanup = () => window.removeEventListener("message", onMessage);
    })();
    return () => {
      removed = true;
      cleanup();
    };
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
        <ProfileContext.Provider
          value={{ profile, loading: profileLoading, reload: loadProfile }}
        >
          <div className="min-h-screen bg-[#eef2ef] text-neutral-800">
            <PortalChrome />
            <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-6">{children}</main>
          </div>
          <SystemTabsOverlay />
        </ProfileContext.Provider>
      </SystemsContext.Provider>
    </RoleContext.Provider>
  );
}
