"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Contract {
  id: number;
  status: string | null;
  showroom_id: string | null;
  contract_amount: number | null;
  contract_date: string | null;
  created_at: string | null;
  design_status: string | null;
  design_confirmed: boolean | null;
  construction_confirmed: boolean | null;
  construction_start_ok: boolean | null;
  is_deleted: boolean | null;
}

const eok = (n: number) => {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억원`;
  if (n >= 1_0000) return `${Math.round(n / 1_0000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
};

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

function monthKey(c: Contract): string | null {
  const d = c.contract_date || c.created_at;
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExecDashboardPage() {
  const { profile, loading } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<Contract[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const res = await supabase
        .from("contracts")
        .select(
          "id, status, showroom_id, contract_amount, contract_date, created_at, design_status, design_confirmed, construction_confirmed, construction_start_ok, is_deleted",
        )
        .limit(5000);
      if (res.error) setError(true);
      else setRows(((res.data ?? []) as Contract[]).filter((r) => !r.is_deleted));
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
    const showroom: Record<string, { count: number; amount: number }> = {};

    let total = 0, totalAmt = 0, monthCnt = 0, monthAmt = 0;
    let designConfirmed = 0, consConfirmed = 0, consStartOk = 0;

    for (const c of rows) {
      total++;
      const amt = Number(c.contract_amount) || 0;
      totalAmt += amt;
      const mk = monthKey(c);
      if (mk && mk in monthCount) monthCount[mk]++;
      if (mk === thisMonth) {
        monthCnt++;
        monthAmt += amt;
      }
      const st = (c.status ?? "미분류").trim() || "미분류";
      statusCount[st] = (statusCount[st] ?? 0) + 1;

      const sh = normShowroom(c.showroom_id);
      (showroom[sh] ??= { count: 0, amount: 0 }).count++;
      showroom[sh].amount += amt;

      if (c.design_confirmed) designConfirmed++;
      if (c.construction_confirmed) consConfirmed++;
      if (c.construction_start_ok) consStartOk++;
    }

    const monthly = months.map((m) => ({ month: m, count: monthCount[m] }));
    const maxMonth = Math.max(1, ...monthly.map((m) => m.count));
    const statuses = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
    const maxStatus = Math.max(1, ...statuses.map(([, n]) => n));
    const showrooms = Object.entries(showroom).sort((a, b) => b[1].count - a[1].count);
    const maxShowroom = Math.max(1, ...showrooms.map(([, v]) => v.count));

    return {
      total, totalAmt, monthCnt, monthAmt, monthly, maxMonth, statuses, maxStatus,
      showrooms, maxShowroom, designConfirmed, consConfirmed, consStartOk,
    };
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
        <p className="mt-1 text-sm text-seum-50/90">계약 실적 · 전시장별 현황 · 설계/시공 진행</p>
      </section>

      {/* 영업팀 현황 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-seum-100 text-seum-600">
            <Icon name="contract" size={16} />
          </span>
          <h2 className="text-base font-bold text-neutral-900">영업팀 현황</h2>
          <span className="text-xs text-neutral-400">계약(contracts) 기준</span>
        </div>

        {loadingData ? (
          <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
        ) : error ? (
          <p className="rounded-xl border border-dashed border-rose-200 bg-white py-10 text-center text-sm text-rose-500">
            계약 데이터를 불러올 수 없습니다. (contracts 조회 권한 필요)
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="총 계약 건수" value={`${d.total.toLocaleString("ko-KR")}건`} />
              <Kpi label="이번달 계약" value={`${d.monthCnt.toLocaleString("ko-KR")}건`} accent />
              <Kpi label="이번달 계약 금액" value={eok(d.monthAmt)} />
              <Kpi label="누적 계약 금액" value={eok(d.totalAmt)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 월별 계약 건수 */}
              <Panel title="월별 계약 건수 (최근 12개월)">
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

              {/* 전시장별 실적 */}
              <Panel title="전시장별 실적">
                <ul className="space-y-2.5">
                  {d.showrooms.map(([sh, v]) => (
                    <li key={sh} className="text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-neutral-800">{sh}</span>
                        <span className="tabular-nums text-neutral-500">
                          {v.count}건 <span className="text-neutral-400">· {eok(v.amount)}</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-seum-400" style={{ width: `${(v.count / d.maxShowroom) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                  {d.showrooms.length === 0 && (
                    <li className="py-6 text-center text-sm text-neutral-400">데이터가 없습니다.</li>
                  )}
                </ul>
              </Panel>
            </div>

            {/* 계약 진행 상태 */}
            <Panel title="계약 진행 상태">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {d.statuses.map(([st, n]) => (
                  <li key={st} className="flex items-center gap-2 text-sm">
                    <span className={`w-28 shrink-0 truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusTone(st)}`}>
                      {st}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-seum-400" style={{ width: `${(n / d.maxStatus) * 100}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right tabular-nums text-neutral-600">{n}건</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </section>

      {/* 설계팀 · 시공팀 현황 */}
      {!loadingData && !error && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="설계팀 현황" icon="design">
            <div className="grid grid-cols-2 gap-3">
              <Mini label="설계 확정" value={d.designConfirmed} tone="text-seum-700 bg-seum-50" />
              <Mini label="설계 미확정" value={Math.max(0, d.total - d.designConfirmed)} tone="text-amber-700 bg-amber-50" />
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">계약 기준 설계 확정 여부</p>
          </Panel>
          <Panel title="시공팀 현황" icon="construction">
            <div className="grid grid-cols-2 gap-3">
              <Mini label="시공 확정" value={d.consConfirmed} tone="text-seum-700 bg-seum-50" />
              <Mini label="착공 가능" value={d.consStartOk} tone="text-blue-700 bg-blue-50" />
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">계약 기준 시공 확정·착공 승인</p>
          </Panel>
        </section>
      )}
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

function Panel({ title, icon, children }: { title: string; icon?: "design" | "construction"; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-neutral-800">
        {icon && <Icon name={icon} size={15} className="text-neutral-500" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg px-3 py-3 ${tone}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{value.toLocaleString("ko-KR")}</p>
    </div>
  );
}
