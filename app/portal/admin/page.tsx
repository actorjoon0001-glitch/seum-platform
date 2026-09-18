"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";
import { EmployeeManager, type Emp } from "@/features/portal/components/EmployeeManager";

const TEAM_LABELS: Record<string, string> = {
  경영: "경영", 마케팅: "마케팅", 영업: "영업", 설계: "설계", 시공: "시공", 정산: "정산",
};
const SHOWROOM_LABELS: Record<string, string> = {
  headquarters: "본사 전시장",
  showroom1: "1전시장",
  ganghwa: "강화전시장",
  andong: "안동전시장",
  gwangju: "광주전시장",
};
const teamLabel = (v: string | null) => (v ? TEAM_LABELS[v] ?? v : "-");
const showroomLabel = (v: string | null) => (v ? SHOWROOM_LABELS[v] ?? v : "-");

function fmtPhone(p: string | null): string {
  if (!p) return "";
  const d = p.replace(/[^0-9]/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [tab, setTab] = useState<"approve" | "manage">("approve");
  const [rows, setRows] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .select(
          "id, name, team, role, position_name, phone, email, showroom, permission, status, birth_date, created_at",
        )
        .order("created_at", { ascending: false });
      setRows(res.error ? [] : ((res.data ?? []) as Emp[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const pending = useMemo(
    () => rows.filter((r) => (r.status ?? "") !== "approved" && (r.status ?? "") !== "rejected"),
    [rows],
  );

  async function setStatus(emp: Emp, status: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("employees").update({ status } as never).eq("id", emp.id);
    await load();
  }

  if (!profileLoading && !isAdmin) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <p className="text-sm text-neutral-500">관리자 전용 페이지입니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-600 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="chart" size={22} /> 관리자
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">직원 승인 및 계정 관리 (관리자 전용)</p>
      </section>

      <div className="flex gap-2">
        <TabBtn active={tab === "approve"} onClick={() => setTab("approve")}>
          직원 승인 관리
          {pending.length > 0 && (
            <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pending.length}
            </span>
          )}
        </TabBtn>
        <TabBtn active={tab === "manage"} onClick={() => setTab("manage")}>
          직원 관리
        </TabBtn>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : tab === "approve" ? (
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {pending.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400">승인 대기 중인 직원이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {pending.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                      {e.name ?? "-"}
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {e.status ?? "대기"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {[teamLabel(e.team), showroomLabel(e.showroom), e.email, fmtPhone(e.phone)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(e, "approved")}
                      className="rounded-md bg-seum-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-seum-600"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(e, "rejected")}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                    >
                      반려
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <EmployeeManager rows={rows} reload={load} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "bg-seum-500 text-white shadow-sm"
          : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}
