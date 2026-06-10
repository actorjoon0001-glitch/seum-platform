import { Icon } from "./icons";
import { kpis } from "../data/mock";

const TONE: Record<string, { ring: string; bg: string; text: string }> = {
  green: { ring: "ring-seum-100", bg: "bg-seum-50", text: "text-seum-600" },
  blue: { ring: "ring-blue-100", bg: "bg-blue-50", text: "text-blue-600" },
  amber: { ring: "ring-amber-100", bg: "bg-amber-50", text: "text-amber-600" },
  violet: { ring: "ring-violet-100", bg: "bg-violet-50", text: "text-violet-600" },
};

/** 상단 KPI 카드 행 — 대시보드 진입 시 핵심 지표 4종 */
export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const t = TONE[k.tone];
        return (
          <div
            key={k.label}
            className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text} ring-4 ${t.ring}`}
            >
              <Icon name={k.icon} size={24} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-neutral-500">{k.label}</p>
              <p className="mt-0.5 truncate text-xl font-bold text-neutral-900">{k.value}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="truncate">{k.sub}</span>
                {k.delta && (
                  <span
                    className={
                      k.delta.dir === "up" ? "text-seum-600" : "text-rose-500"
                    }
                  >
                    {k.delta.dir === "up" ? "▲" : "▼"} {k.delta.text}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
