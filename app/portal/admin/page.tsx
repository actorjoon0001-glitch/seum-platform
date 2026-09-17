"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Emp {
  id: number | string;
  name: string | null;
  team: string | null;
  position_name: string | null;
  phone: string | null;
  email: string | null;
  showroom: string | null;
  permission: string | null;
  status: string | null;
  created_at: string | null;
}

const TEAM_OPTIONS = [
  { value: "경영", label: "경영" },
  { value: "마케팅", label: "마케팅" },
  { value: "영업", label: "영업" },
  { value: "설계", label: "설계" },
  { value: "시공", label: "시공" },
  { value: "정산", label: "경영지원팀" },
];
const SHOWROOM_OPTIONS = [
  { value: "headquarters", label: "본사 전시장" },
  { value: "showroom1", label: "1전시장" },
  { value: "ganghwa", label: "강화전시장" },
  { value: "andong", label: "안동전시장" },
  { value: "gwangju", label: "광주전시장" },
];
const PERMISSION_OPTIONS = [
  { value: "", label: "일반 직원" },
  { value: "admin", label: "관리자(admin)" },
  { value: "master", label: "마스터(master)" },
];
const STATUS_OPTIONS = [
  { value: "approved", label: "승인" },
  { value: "pending", label: "대기" },
  { value: "rejected", label: "반려" },
];
const teamLabel = (v: string | null) =>
  TEAM_OPTIONS.find((t) => t.value === v)?.label ?? v ?? "-";
const showroomLabel = (v: string | null) =>
  SHOWROOM_OPTIONS.find((s) => s.value === v)?.label ?? v ?? "-";
const permLabel = (v: string | null) =>
  PERMISSION_OPTIONS.find((p) => p.value === (v ?? ""))?.label ?? v ?? "일반 직원";

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
  const [editing, setEditing] = useState<Emp | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .select("id, name, team, position_name, phone, email, showroom, permission, status, created_at")
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
    () => rows.filter((r) => (r.status ?? "") !== "approved"),
    [rows],
  );
  const managed = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.team, r.email, r.phone].some((v) => (v ?? "").includes(q)),
    );
  }, [rows, query]);

  async function setStatus(emp: Emp, status: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("employees").update({ status } as never).eq("id", emp.id);
    await load();
  }

  async function remove(emp: Emp) {
    if (!window.confirm(`'${emp.name ?? "이 직원"}' 님을 삭제할까요?`)) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("employees").delete().eq("id", emp.id);
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
        <section className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·팀·이메일·연락처 검색"
            className="w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500"
          />
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/60 text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">이름</th>
                  <th className="px-4 py-2.5 font-medium">부서</th>
                  <th className="px-4 py-2.5 font-medium">전시장</th>
                  <th className="px-4 py-2.5 font-medium">연락처</th>
                  <th className="px-4 py-2.5 font-medium">권한</th>
                  <th className="px-4 py-2.5 font-medium">상태</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {managed.map((e) => (
                  <tr key={e.id} className="hover:bg-seum-50/40">
                    <td className="px-4 py-2.5 font-semibold text-neutral-900">
                      {e.name ?? "-"}
                      {e.position_name && (
                        <span className="ml-1 text-xs font-normal text-neutral-400">{e.position_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">{teamLabel(e.team)}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{showroomLabel(e.showroom)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-neutral-600">{fmtPhone(e.phone)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          e.permission === "master"
                            ? "bg-violet-100 text-violet-700"
                            : e.permission === "admin"
                              ? "bg-seum-100 text-seum-700"
                              : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {permLabel(e.permission)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          e.status === "approved"
                            ? "bg-seum-100 text-seum-700"
                            : e.status === "rejected"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === e.status)?.label ?? e.status ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(e)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-seum-600"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
                {managed.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">
                      직원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing && (
        <EditModal
          emp={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
          onDelete={() => remove(editing)}
        />
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

function EditModal({
  emp,
  onClose,
  onSaved,
  onDelete,
}: {
  emp: Emp;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(emp.name ?? "");
  const [position, setPosition] = useState(emp.position_name ?? "");
  const [team, setTeam] = useState(emp.team ?? "");
  const [showroom, setShowroom] = useState(emp.showroom ?? "");
  const [phone, setPhone] = useState(emp.phone ?? "");
  const [permission, setPermission] = useState(emp.permission ?? "");
  const [status, setStatus] = useState(emp.status ?? "approved");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-seum-500 focus:ring-2 focus:ring-seum-100";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("employees")
        .update({
          name: name.trim() || null,
          position_name: position.trim() || null,
          team: team || null,
          showroom: showroom || null,
          phone: phone.trim() || null,
          permission: permission || null,
          status: status || null,
        } as never)
        .eq("id", emp.id);
      if (res.error) throw res.error;
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">직원 정보 수정</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Field label="이름">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="직책">
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 팀장" className={inputClass} />
          </Field>
          <Field label="부서">
            <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputClass}>
              <option value="">선택</option>
              {TEAM_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="전시장">
            <select value={showroom} onChange={(e) => setShowroom(e.target.value)} className={inputClass}>
              <option value="">선택</option>
              {SHOWROOM_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="핸드폰">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={inputClass} />
          </Field>
          <Field label="권한">
            <select value={permission} onChange={(e) => setPermission(e.target.value)} className={inputClass}>
              {PERMISSION_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="상태">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100"
            >
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-seum-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
