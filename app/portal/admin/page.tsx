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

  const [tab, setTab] = useState<"approve" | "manage" | "presence" | "attendance">("approve");
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
        <TabBtn active={tab === "presence"} onClick={() => setTab("presence")}>
          접속 현황
        </TabBtn>
        <TabBtn active={tab === "attendance"} onClick={() => setTab("attendance")}>
          근태 현황
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
      ) : tab === "manage" ? (
        <EmployeeManager rows={rows} reload={load} />
      ) : tab === "presence" ? (
        <PresencePanel />
      ) : (
        <AttendancePanel />
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

interface Presence {
  user_id: string;
  name: string | null;
  team: string | null;
  last_seen: string | null;
}

const ONLINE_MS = 3 * 60 * 1000; // 3분 이내 = 접속 중

interface LoginEvent {
  id: string;
  name: string | null;
  team: string | null;
  created_at: string | null;
}

function PresencePanel() {
  const [rows, setRows] = useState<Presence[]>([]);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [pres, ev] = await Promise.all([
        supabase
          .from("portal_presence")
          .select("user_id, name, team, last_seen")
          .order("last_seen", { ascending: false }),
        supabase
          .from("login_events")
          .select("id, name, team, created_at")
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      setRows(pres.error ? [] : ((pres.data ?? []) as Presence[]));
      setEvents(ev.error ? [] : ((ev.data ?? []) as LoginEvent[]));
    } catch {
      setRows([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      setNow(Date.now());
      load();
    }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const online = rows.filter((r) => r.last_seen && now - Date.parse(r.last_seen) < ONLINE_MS);

  function fmt(ts: string | null) {
    if (!ts) return "-";
    const diff = now - Date.parse(ts);
    if (diff < ONLINE_MS) return "접속 중";
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    return ts.slice(0, 16).replace("T", " ");
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-seum-50 px-3 py-1 text-sm font-semibold text-seum-700">
          <span className="h-2 w-2 rounded-full bg-seum-500" />
          접속 중 {online.length}명
        </span>
        <span className="text-xs text-neutral-400">최근 3분 이내 활동 기준 · 30초마다 갱신</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">접속 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((r) => {
              const isOnline = r.last_seen && now - Date.parse(r.last_seen) < ONLINE_MS;
              return (
                <li key={r.user_id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isOnline ? "bg-seum-500" : "bg-neutral-300"
                    }`}
                  />
                  <span className="text-sm font-semibold text-neutral-900">{r.name ?? "-"}</span>
                  {r.team && <span className="text-xs text-neutral-400">{r.team}</span>}
                  <span
                    className={`ml-auto text-xs tabular-nums ${
                      isOnline ? "font-semibold text-seum-600" : "text-neutral-400"
                    }`}
                  >
                    {fmt(r.last_seen)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 오늘 접속 기록 */}
      <div className="pt-2">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-bold text-neutral-800">오늘 접속 기록</h3>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
            {events.length}건
          </span>
          <span className="text-xs text-neutral-400">오늘 0시 이후 · 방문 단위(30분)</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {events.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">오늘 접속 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-sm font-semibold text-neutral-900">{e.name ?? "-"}</span>
                  {e.team && <span className="text-xs text-neutral-400">{e.team}</span>}
                  <span className="ml-auto text-xs tabular-nums text-neutral-500">
                    {e.created_at
                      ? new Date(e.created_at).toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

interface AttendanceRow {
  id: string;
  user_name: string | null;
  team: string | null;
  check_in: string | null;
  check_out: string | null;
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
const hhmm = (ts: string | null) =>
  ts
    ? new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "-";
function worked(inTs: string | null, outTs: string | null) {
  if (!inTs || !outTs) return "-";
  const ms = Date.parse(outTs) - Date.parse(inTs);
  if (ms <= 0) return "-";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}시간 ${m}분`;
}

function AttendancePanel() {
  const [date, setDate] = useState(todayLocal());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("attendance")
        .select("id, user_name, team, check_in, check_out")
        .eq("date", date)
        .order("check_in", { ascending: true });
      setRows(res.error ? [] : ((res.data ?? []) as AttendanceRow[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const done = rows.filter((r) => r.check_out).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
        />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-seum-50 px-3 py-1 text-sm font-semibold text-seum-700">
          출근 {rows.length}명
        </span>
        <span className="text-xs text-neutral-400">· 퇴근 완료 {done}명</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">팀</th>
              <th className="px-4 py-2.5 font-medium">출근</th>
              <th className="px-4 py-2.5 font-medium">퇴근</th>
              <th className="px-4 py-2.5 font-medium">근무시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">
                  해당 날짜 근태 기록이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-seum-50/40">
                  <td className="px-4 py-2.5 font-semibold text-neutral-900">{r.user_name ?? "-"}</td>
                  <td className="px-4 py-2.5 text-neutral-600">{r.team ?? "-"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-seum-600">{hhmm(r.check_in)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-rose-500">{hhmm(r.check_out)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-neutral-600">
                    {worked(r.check_in, r.check_out)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
