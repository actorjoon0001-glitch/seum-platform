"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Econtract {
  id: number;
  status: string | null;
  showroom: string | null;
  salesperson: string | null;
  contract_date: string | null;
  created_at: string | null;
}

/** 전시장 라벨 표준화 (코드/한글 변형 통합) */
function normShowroom(v: string | null): string {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return "기타";
  if (/head|본사|본점/.test(s)) return "본사 전시장";
  if (/showroom1|1전시장/.test(s)) return "1전시장";
  if (/ganghwa|강화/.test(s)) return "강화전시장";
  if (/andong|안동/.test(s)) return "안동전시장";
  if (/gwangju|광주/.test(s)) return "광주전시장";
  if (/showroom3|3전시장/.test(s)) return "3전시장";
  return (v ?? "").trim() || "기타";
}

/** 상태 라벨 */
const STATUS_LABEL: Record<string, string> = { draft: "작성중", confirmed: "확정" };
const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

const TONES = [
  "bg-seum-100 text-seum-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-slate-100 text-slate-600",
];
const STATUS_TONE: Record<string, string> = {};
function statusTone(s: string) {
  if (!STATUS_TONE[s]) STATUS_TONE[s] = TONES[Object.keys(STATUS_TONE).length % TONES.length];
  return STATUS_TONE[s];
}

function monthKey(c: Econtract): string | null {
  const d = c.contract_date && /^\d{4}-\d{2}/.test(c.contract_date) ? c.contract_date : c.created_at;
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExecDashboardPage() {
  const { profile, loading } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Econtract[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("econtracts")
        .select("id, status, showroom, salesperson, contract_date, created_at")
        .limit(5000);
      if (res.error) setError(true);
      else setRows((res.data ?? []) as Econtract[]);
    } catch {
      setError(true);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const d = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthCount: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
    const statusCount: Record<string, number> = {};
    type ShowroomAgg = { count: number; monthCount: number; status: Record<string, number> };
    const showroom: Record<string, ShowroomAgg> = {};

    let total = 0, monthCnt = 0, confirmed = 0, draft = 0;

    for (const c of rows) {
      total++;
      const mk = monthKey(c);
      const isThisMonth = mk === thisMonth;
      if (mk && mk in monthCount) monthCount[mk]++;
      if (isThisMonth) monthCnt++;

      const st = (c.status ?? "미분류").trim() || "미분류";
      statusCount[st] = (statusCount[st] ?? 0) + 1;
      if (st === "confirmed") confirmed++;
      if (st === "draft") draft++;

      const sh = normShowroom(c.showroom);
      const agg = (showroom[sh] ??= { count: 0, monthCount: 0, status: {} });
      agg.count++;
      agg.status[st] = (agg.status[st] ?? 0) + 1;
      if (isThisMonth) agg.monthCount++;
    }

    const monthly = months.map((m) => ({ month: m, count: monthCount[m] }));
    const maxMonth = Math.max(1, ...monthly.map((m) => m.count));
    const statuses = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
    const maxStatus = Math.max(1, ...statuses.map(([, n]) => n));
    const showrooms = Object.entries(showroom).sort((a, b) => b[1].count - a[1].count);

    return { total, monthCnt, confirmed, draft, monthly, maxMonth, statuses, maxStatus, showrooms };
  }, [rows]);

  if (!loading && !isAdmin) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <p className="text-sm text-neutral-500">대표이사 전용 페이지입니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-seum-700 to-seum-500 px-6 py-6 text-white shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Icon name="chart" size={22} /> 대표이사 대시보드
        </h1>
        <p className="mt-1 text-sm text-seum-50/90">전자계약 등록 기준 영업 현황</p>
      </section>

      {/* 영업팀 현황 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-seum-100 text-seum-600">
            <Icon name="contract" size={16} />
          </span>
          <h2 className="text-base font-bold text-neutral-900">영업팀 현황</h2>
          <span className="text-xs text-neutral-400">전자계약(econtracts) 등록 기준</span>
        </div>

        {loadingData ? (
          <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
        ) : error ? (
          <p className="rounded-xl border border-dashed border-rose-200 bg-white py-10 text-center text-sm text-rose-500">
            전자계약 데이터를 불러올 수 없습니다. (econtracts 조회 권한 필요)
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="총 전자계약" value={`${d.total.toLocaleString("ko-KR")}건`} />
              <Kpi label="이번달 등록" value={`${d.monthCnt.toLocaleString("ko-KR")}건`} accent />
              <Kpi label="확정 완료" value={`${d.confirmed.toLocaleString("ko-KR")}건`} />
              <Kpi label="작성중" value={`${d.draft.toLocaleString("ko-KR")}건`} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 월별 등록 건수 */}
              <Panel title="월별 전자계약 등록 (최근 12개월)">
                <div className="flex h-44 items-end gap-1.5">
                  {d.monthly.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold tabular-nums text-neutral-500">{m.count || ""}</span>
                      <div
                        className="w-full rounded-t bg-seum-400"
                        style={{ height: `${(m.count / d.maxMonth) * 100}%`, minHeight: m.count ? 4 : 0 }}
                        title={`${m.month}: ${m.count}건`}
                      />
                      <span className="text-[9px] text-neutral-400">{m.month.slice(5)}월</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* 진행 상태 */}
              <Panel title="계약 진행 상태">
                <ul className="space-y-2">
                  {d.statuses.map(([st, n]) => (
                    <li key={st} className="flex items-center gap-2 text-sm">
                      <span className={`w-24 shrink-0 truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusTone(st)}`}>
                        {statusLabel(st)}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-seum-400" style={{ width: `${(n / d.maxStatus) * 100}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right tabular-nums text-neutral-600">{n}건</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            {/* 전시장별 실적 (상세) */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-800">전시장별 실적</h3>
                <span className="text-xs text-neutral-400">전시장별 전자계약 건수 · 진행 상태</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {d.showrooms.map(([sh, v]) => {
                  const sts = Object.entries(v.status).sort((a, b) => b[1] - a[1]);
                  return (
                    <div key={sh} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
                          <Icon name="site" size={14} className="text-seum-500" />
                          {sh}
                        </h4>
                        <span className="rounded-full bg-seum-50 px-2 py-0.5 text-xs font-semibold text-seum-700">
                          {v.count}건
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        이번달 <span className="font-bold text-seum-700">{v.monthCount}건</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {sts.map(([st, n]) => (
                          <span key={st} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusTone(st)}`}>
                            {statusLabel(st)} {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {d.showrooms.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-neutral-400">데이터가 없습니다.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* 설계팀 · 시공팀 현황 (전용 데이터 연동 예정) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          { icon: "design" as const, name: "설계팀 현황" },
          { icon: "construction" as const, name: "시공팀 현황" },
        ].map((s) => (
          <div key={s.name} className="rounded-xl border border-dashed border-neutral-300 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                <Icon name={s.icon} size={16} />
              </span>
              <h2 className="text-base font-bold text-neutral-900">{s.name}</h2>
            </div>
            <p className="mt-3 text-sm text-neutral-400">
              진행 데이터 연동 준비중입니다. 해당 팀 현황 테이블을 알려주시면 요약 카드로 추가합니다.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? "border-seum-200 bg-seum-50" : "border-neutral-200 bg-white"}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${accent ? "text-seum-700" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-neutral-800">{title}</h3>
      {children}
    </div>
  );
}
