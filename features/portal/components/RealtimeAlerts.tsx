"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { Icon } from "./icons";
import { alertIcon, makeDemoAlert, seedAlerts } from "../data/mock";
import type { AlertItem } from "../data/mock";

const TONE: Record<string, string> = {
  "신규 문의": "bg-blue-50 text-blue-600",
  "신규 방문예약": "bg-amber-50 text-amber-600",
  "신규 계약": "bg-seum-50 text-seum-600",
  "설계 완료": "bg-violet-50 text-violet-600",
  "시공 완료": "bg-rose-50 text-rose-600",
};

/**
 * 5열 — 실시간 알림.
 *
 * Supabase Realtime 채널(`portal-alerts`)의 broadcast 이벤트를 구독한다.
 * 환경변수/테이블이 아직 없으면 데모 시뮬레이터로 실시간 흐름을 보여준다.
 * (실제 이벤트가 들어오면 그대로 함께 표시된다.)
 */
export function RealtimeAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(seedAlerts);
  const [live, setLive] = useState(false);
  const seen = useRef(new Set(seedAlerts.map((a) => a.id)));

  const push = (a: AlertItem) => {
    if (seen.current.has(a.id)) return;
    seen.current.add(a.id);
    setAlerts((prev) => [a, ...prev].slice(0, 12));
  };

  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        channel = supabase
          .channel("portal-alerts")
          .on("broadcast", { event: "alert" }, ({ payload }) => {
            push(payload as AlertItem);
          })
          .subscribe((status) => {
            if (!cancelled && status === "SUBSCRIBED") setLive(true);
          });
      } catch {
        // Supabase 미설정 → 데모 모드 (아래 시뮬레이터만 동작)
      }
    })();

    // 데모 시뮬레이터: 주기적으로 새 알림 생성
    const sim = setInterval(() => push(makeDemoAlert()), 14000);

    return () => {
      cancelled = true;
      clearInterval(sim);
      channel?.unsubscribe();
    };
  }, []);

  return (
    <Card
      title="실시간 알림"
      icon="bell"
      headerRight={
        <span className="flex items-center gap-1.5 rounded-full bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-seum-500" : "animate-pulse bg-amber-400"
            }`}
          />
          {live ? "Live" : "Demo"}
        </span>
      }
      bodyClassName="max-h-[420px] overflow-y-auto"
    >
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-lg border border-neutral-100 px-3 py-2.5"
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE[a.type]}`}
            >
              <Icon name={alertIcon[a.type]} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-800">{a.type}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                  {a.at}
                </span>
              </p>
              <p className="mt-0.5 truncate text-xs text-neutral-500">{a.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
