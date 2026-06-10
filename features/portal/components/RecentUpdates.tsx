import { Card } from "./Card";
import { recentUpdates } from "../data/mock";
import type { UpdateItem } from "../data/mock";

const TAG_STYLE: Record<UpdateItem["tag"], string> = {
  신규: "bg-seum-100 text-seum-700",
  개선: "bg-blue-100 text-blue-700",
  수정: "bg-amber-100 text-amber-700",
};

/** 최근 업데이트 — 세움 플랫폼 및 각 OS 업데이트 내역 */
export function RecentUpdates() {
  return (
    <Card title="최근 업데이트" icon="update">
      <ul className="space-y-2.5">
        {recentUpdates.map((u) => (
          <li key={u.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${TAG_STYLE[u.tag]}`}
            >
              {u.tag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">{u.system}</span>{" "}
                {u.text}
              </p>
              <p className="text-[11px] tabular-nums text-neutral-400">{u.date}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
