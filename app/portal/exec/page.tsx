"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/features/portal/components/icons";
import { useProfile } from "@/features/portal/components/PortalProvider";

interface Econtract {
  id: number;
  status: string | null;
  salesperson: string | null;
  showroom: string | null;
  total_amount: number | null;
  contract_date: string | null;
  created_at: string | null;
}

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const eok = (n: number) => {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억원`;
  if (n >= 1_0000) return `${Math.round(n / 1_0000).toLocaleString("ko-KR")}만원`;
  return won(n);
};

/** 진행 상태 배지 색 */
const STATUS_TONE: Record<string, string> = {};
const TONES = [
  "bg-seum-100 text-seum-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-slate-100 text-slate-600",
];
function statusTone(s: string) {
  if (!STATUS_TONE[s]) {
    STATUS_TONE[s] = TONES[Object.keys(STATUS_TONE).length % TONES.length];
  }
  return STATUS_TONE[s];
}

function monthKeyOf(c: Econtract): string | null {
  // contract_date(텍스트)가 YYYY-MM… 형태면 우선, 아니면 created_at
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
        .select("id, status, salesperson, showroom, total_amount, contract_date, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
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

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 최근 12개월 키
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthCount: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
    const statusCount: Record<string, number> = {};

    let total = 0;
    let totalAmount = 0;
    let monthCountThis = 0;
    let monthAmountThis = 0;

    for (const c of rows) {
      total++;
      const amt = Number(c.total_amount) || 0;
      totalAmount += amt;
      const mk = monthKeyOf(c);
      if (mk && mk in monthCount) monthCount[mk]++;
      if (mk === thisMonth) {
        monthCountThis++;
        monthAmountThis += amt;
      }
      const st = (c.status ?? "미분류").trim() || "미분류";
      statusCount[st] = (statusCount[st] ?? 0) + 1;
    }

    const monthly = months.map((m) => ({ month: m, count: monthCount[m] }));
    const maxMonth = Math.max(1, ...monthly.map((m) => m.count));
    const statuses = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
    const maxStatus = Math.max(1, ...statuses.map(([, n]) => n));

    return { total, totalAmount, monthCountThis, monthAmountThis, monthly, maxMonth, statuses, maxStatus };
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
        <p className="mt-1 text-sm text-seum-50/90">전자계약 기준 영업·설계·시공 현황 요약</p>
      </section>

      {/* 영업팀 현황 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-seum-100 text-seum-600">
            <Icon name="contract" size={16} />
          </span>
          <h2 className="text-base font-bold text-neutral-900">영업팀 현황</h2>
          <span className="text-xs text-neutral-400">전자계약(econtracts) 기준</span>
        </div>

        {loadingData ? (
          <p className="py-10 text-center text-sm text-neutral-400">불러오는 중…</p>
        ) : error ? (
          <p className="rounded-xl border border-dashed border-rose-200 bg-white py-10 text-center text-sm text-rose-500">
            계약 데이터를 불러올 수 없습니다. (econtracts 조회 권한 필요)
          </p>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="총 계약 건수" value={`${stats.total.toLocaleString("ko-KR")}건`} />
              <Kpi label="이번달 계약" value={`${stats.monthCountThis.toLocaleString("ko-KR")}건`} accent />
              <Kpi label="이번달 계약 금액" value={eok(stats.monthAmountThis)} />
              <Kpi label="누적 계약 금액" value={eok(stats.totalAmount)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 월별 계약 건수 */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-neutral-800">월별 계약 건수 (최근 12개월)</h3>
                <div className="flex h-44 items-end gap-1.5">
                  {stats.monthly.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold tabular-nums text-neutral-500">
                        {m.count || ""}
                      </span>
                      <div
                        className="w-full rounded-t bg-seum-400 transition-all"
                        style={{ height: `${(m.count / stats.maxMonth) * 100}%`, minHeight: m.count ? 4 : 0 }}
                        title={`${m.month}: ${m.count}건`}
                      />
                      <span className="text-[9px] text-neutral-400">{m.month.slice(5)}월</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 진행 상태 */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-neutral-800">계약 진행 상태</h3>
                <ul className="space-y-2">
                  {stats.statuses.map(([st, n]) => (
                    <li key={st} className="flex items-center gap-2 text-sm">
                      <span className={`w-24 shrink-0 truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusTone(st)}`}>
                        {st}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-seum-400"
                          style={{ width: `${(n / stats.maxStatus) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right tabular-nums text-neutral-600">{n}건</span>
                    </li>
                  ))}
                  {stats.statuses.length === 0 && (
                    <li className="py-6 text-center text-sm text-neutral-400">데이터가 없습니다.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 설계팀 · 시공팀 현황 (데이터 연동 예정) */}
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
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        accent ? "border-seum-200 bg-seum-50" : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${accent ? "text-seum-700" : "text-neutral-900"}`}>
        {value}
      </p>
    </div>
  );
}
