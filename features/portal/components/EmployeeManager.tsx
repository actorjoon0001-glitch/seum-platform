"use client";

import { useMemo, useState } from "react";

export interface Emp {
  id: number | string;
  name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  team: string | null;
  role: string | null;
  permission: string | null;
  showroom: string | null;
  status: string | null;
  position_name: string | null;
}

const TEAM_DEFAULTS = ["경영", "마케팅", "영업", "설계", "시공", "정산"];
const ROLE_DEFAULTS = ["staff", "admin", "master"];
const PERM_DEFAULTS = ["staff", "admin", "master", "external_architect"];
const SHOWROOM_DEFAULTS = ["headquarters", "showroom1", "ganghwa", "andong", "gwangju"];
const STATUS_OPTIONS = ["approved", "pending", "rejected"];

const SHOWROOM_LABEL: Record<string, string> = {
  headquarters: "본사 전시장",
  showroom1: "1전시장",
  ganghwa: "강화전시장",
  andong: "안동전시장",
  gwangju: "광주전시장",
};
const showroomLabel = (v: string | null) => (v ? SHOWROOM_LABEL[v] ?? v : "기타");
const teamLabel = (v: string | null) => (v ? `${v}팀` : "기타");

function ageOf(birth: string | null): string {
  if (!birth) return "-";
  const [y, m, d] = birth.split("-").map(Number);
  if (!y) return birth;
  const t = new Date();
  let age = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) age--;
  return `${birth} / ${age}세`;
}

/** 데이터에 존재하는 값 + 기본값 합쳐서 옵션 구성 (기존 커스텀 값 보존) */
function optionSet(defaults: string[], values: (string | null)[]): string[] {
  const s = new Set<string>(defaults);
  for (const v of values) if (v) s.add(v);
  return Array.from(s);
}

export function EmployeeManager({
  rows,
  reload,
}: {
  rows: Emp[];
  reload: () => Promise<void>;
}) {
  const [showroom, setShowroom] = useState("");
  const [team, setTeam] = useState("");
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<Emp>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const roleOptions = useMemo(() => optionSet(ROLE_DEFAULTS, rows.map((r) => r.role)), [rows]);
  const permOptions = useMemo(
    () => optionSet(PERM_DEFAULTS, rows.map((r) => r.permission)),
    [rows],
  );
  const teamOptions = useMemo(() => optionSet(TEAM_DEFAULTS, rows.map((r) => r.team)), [rows]);
  const showroomOptions = useMemo(
    () => optionSet(SHOWROOM_DEFAULTS, rows.map((r) => r.showroom)),
    [rows],
  );

  const filtered = useMemo(() => {
    const kw = q.trim();
    return rows.filter((r) => {
      if (showroom && (r.showroom ?? "") !== showroom) return false;
      if (team && (r.team ?? "") !== team) return false;
      if (kw && ![r.name, r.email].some((v) => (v ?? "").includes(kw))) return false;
      return true;
    });
  }, [rows, showroom, team, q]);

  // 전시장 → 팀 그룹
  const groups = useMemo(() => {
    const byShowroom = new Map<string, Emp[]>();
    for (const r of filtered) {
      const k = r.showroom ?? "기타";
      (byShowroom.get(k) ?? byShowroom.set(k, []).get(k)!).push(r);
    }
    const order = [...SHOWROOM_DEFAULTS, "기타"];
    const keys = [
      ...order.filter((k) => byShowroom.has(k)),
      ...Array.from(byShowroom.keys()).filter((k) => !order.includes(k)),
    ];
    return keys.map((sh) => {
      const list = byShowroom.get(sh)!;
      const byTeam = new Map<string, Emp[]>();
      for (const r of list) {
        const t = r.team ?? "기타";
        (byTeam.get(t) ?? byTeam.set(t, []).get(t)!).push(r);
      }
      const tOrder = [...TEAM_DEFAULTS, "기타"];
      const tKeys = [
        ...tOrder.filter((k) => byTeam.has(k)),
        ...Array.from(byTeam.keys()).filter((k) => !tOrder.includes(k)),
      ];
      return {
        showroom: sh,
        count: list.length,
        teams: tKeys.map((t) => ({ team: t, members: byTeam.get(t)! })),
      };
    });
  }, [filtered]);

  const val = (r: Emp, k: keyof Emp) => (edits[r.id]?.[k] ?? r[k] ?? "") as string;
  const dirty = (r: Emp) => !!edits[String(r.id)];
  function change(r: Emp, k: keyof Emp, v: string) {
    setEdits((p) => ({ ...p, [r.id]: { ...p[String(r.id)], [k]: v } }));
  }

  async function save(r: Emp) {
    const e = edits[String(r.id)];
    if (!e) return;
    setSavingId(String(r.id));
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase.from("employees").update(e as never).eq("id", r.id);
      if (res.error) throw res.error;
      setEdits((p) => {
        const n = { ...p };
        delete n[String(r.id)];
        return n;
      });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  async function resetPw(r: Emp) {
    if (!r.email) return alert("이메일이 없어 초기화 메일을 보낼 수 없습니다.");
    if (!window.confirm(`${r.name ?? ""}(${r.email}) 님에게 비밀번호 재설정 메일을 보낼까요?`)) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(r.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    alert(error ? `발송 실패: ${error.message}` : "재설정 메일을 보냈습니다.");
  }

  async function remove(r: Emp) {
    if (!window.confirm(`'${r.name ?? "이 직원"}' 님을 삭제할까요?`)) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const res = await supabase.from("employees").delete().eq("id", r.id);
    if (res.error) return alert(res.error.message);
    await reload();
  }

  const selCls =
    "rounded-md border border-neutral-300 bg-white px-1.5 py-1 text-xs text-neutral-900 outline-none focus:border-seum-500";

  return (
    <div className="space-y-3">
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={showroom} onChange={(e) => setShowroom(e.target.value)} className={selCls}>
          <option value="">전체 전시장</option>
          {showroomOptions.map((s) => (
            <option key={s} value={s}>{showroomLabel(s)}</option>
          ))}
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)} className={selCls}>
          <option value="">전체 팀</option>
          {teamOptions.map((t) => (
            <option key={t} value={t}>{teamLabel(t)}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 또는 이메일"
          className="min-w-[180px] flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
        />
        <button
          type="button"
          onClick={() => { setShowroom(""); setTeam(""); setQ(""); }}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(new Set())}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          모두 펼치기
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(new Set(groups.map((g) => g.showroom)))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          모두 접기
        </button>
      </div>

      {groups.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-400">
          직원이 없습니다.
        </p>
      )}

      {groups.map((g) => {
        const open = !collapsed.has(g.showroom);
        return (
          <section key={g.showroom} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() =>
                setCollapsed((p) => {
                  const n = new Set(p);
                  n.has(g.showroom) ? n.delete(g.showroom) : n.add(g.showroom);
                  return n;
                })
              }
              className="flex w-full items-center gap-2 border-b border-neutral-100 bg-neutral-50/70 px-4 py-2.5 text-left"
            >
              <span className="text-neutral-400">{open ? "▾" : "▸"}</span>
              <h3 className="text-sm font-bold text-neutral-900">{showroomLabel(g.showroom)}</h3>
              <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">
                {g.count}명
              </span>
            </button>

            {open &&
              g.teams.map((t) => (
                <div key={t.team} className="border-b border-neutral-50 last:border-0">
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                    <span className="rounded bg-seum-50 px-2 py-0.5 text-[11px] font-semibold text-seum-700">
                      {teamLabel(t.team)}
                    </span>
                    <span className="text-[11px] text-neutral-400">{t.members.length}명</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-xs">
                      <thead className="text-[11px] text-neutral-400">
                        <tr>
                          <th className="px-3 py-1.5 font-medium">이름</th>
                          <th className="px-3 py-1.5 font-medium">이메일</th>
                          <th className="px-3 py-1.5 font-medium">생년월일</th>
                          <th className="px-3 py-1.5 font-medium">팀</th>
                          <th className="px-3 py-1.5 font-medium">역할</th>
                          <th className="px-3 py-1.5 font-medium">권한</th>
                          <th className="px-3 py-1.5 font-medium">전시장</th>
                          <th className="px-3 py-1.5 font-medium">상태</th>
                          <th className="px-3 py-1.5 font-medium">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.members.map((r) => (
                          <tr key={r.id} className="border-t border-neutral-50 hover:bg-seum-50/30">
                            <td className="whitespace-nowrap px-3 py-2 font-semibold text-neutral-900">{r.name ?? "-"}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-neutral-500">{r.email ?? "-"}</td>
                            <td className="whitespace-nowrap px-3 py-2 tabular-nums text-neutral-500">{ageOf(r.birth_date)}</td>
                            <td className="px-3 py-2">
                              <select value={val(r, "team")} onChange={(e) => change(r, "team", e.target.value)} className={selCls}>
                                <option value="">-</option>
                                {teamOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select value={val(r, "role")} onChange={(e) => change(r, "role", e.target.value)} className={selCls}>
                                <option value="">-</option>
                                {roleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select value={val(r, "permission")} onChange={(e) => change(r, "permission", e.target.value)} className={selCls}>
                                <option value="">-</option>
                                {permOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select value={val(r, "showroom")} onChange={(e) => change(r, "showroom", e.target.value)} className={selCls}>
                                <option value="">-</option>
                                {showroomOptions.map((o) => <option key={o} value={o}>{showroomLabel(o)}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select value={val(r, "status")} onChange={(e) => change(r, "status", e.target.value)} className={selCls}>
                                {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => save(r)}
                                  disabled={!dirty(r) || savingId === String(r.id)}
                                  className={`rounded px-2 py-1 text-[11px] font-semibold text-white transition ${
                                    dirty(r) ? "bg-seum-500 hover:bg-seum-600" : "bg-neutral-300"
                                  } disabled:opacity-60`}
                                >
                                  {savingId === String(r.id) ? "저장…" : "저장"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resetPw(r)}
                                  className="rounded border border-neutral-300 px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50"
                                >
                                  비번 초기화
                                </button>
                                <button
                                  type="button"
                                  onClick={() => remove(r)}
                                  className="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </section>
        );
      })}
    </div>
  );
}
