import { Card } from "./Card";
import { contractStatus } from "../data/mock";

const BAR_TONE = [
  "bg-seum-500",
  "bg-seum-400",
  "bg-blue-400",
  "bg-violet-400",
  "bg-amber-400",
];

/** 3열 — 계약 현황 (퍼널형 막대 그래프) */
export function ContractStatus() {
  const conv = Math.round(
    (contractStatus[contractStatus.length - 1].value / contractStatus[0].value) * 100,
  );

  return (
    <Card
      title="계약 현황"
      icon="chart"
      headerRight={
        <span className="rounded-full bg-seum-50 px-2 py-0.5 text-xs font-medium text-seum-600">
          전환율 {conv}%
        </span>
      }
    >
      <ul className="space-y-3">
        {contractStatus.map((s, i) => (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-neutral-600">{s.label}</span>
              <span className="font-semibold tabular-nums text-neutral-900">
                {s.value}건
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${BAR_TONE[i % BAR_TONE.length]} transition-all`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 text-center">
        <div>
          <p className="text-lg font-bold text-seum-600">18</p>
          <p className="text-[11px] text-neutral-400">신규 계약</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">9</p>
          <p className="text-[11px] text-neutral-400">시공 진행</p>
        </div>
        <div>
          <p className="text-lg font-bold text-violet-600">6</p>
          <p className="text-[11px] text-neutral-400">준공 완료</p>
        </div>
      </div>
    </Card>
  );
}
