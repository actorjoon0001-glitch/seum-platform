"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "../config/roles";
import { DEFAULT_ROLE } from "../config/roles";
import { PortalChrome } from "./PortalChrome";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function useRole(): RoleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within PortalProvider");
  return ctx;
}

/**
 * 포털 셸 + 역할 컨텍스트.
 * 인증 도입 전까지 역할 스위처로 권한별 메뉴 노출을 미리본다.
 */
export function PortalProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(DEFAULT_ROLE);

  return (
    <Ctx.Provider value={{ role, setRole }}>
      <div className="min-h-screen bg-[#eef2ef] text-neutral-800">
        <PortalChrome />
        <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-6">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
