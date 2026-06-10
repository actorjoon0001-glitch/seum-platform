import { Card } from "./Card";
import { Icon } from "./icons";
import { myTasks } from "../data/mock";

/** 4열 — 내 업무 (미처리/결재/승인 카운트) */
export function MyTasks() {
  const total = myTasks.reduce((sum, t) => sum + t.count, 0);

  return (
    <Card
      title="내 업무"
      icon="task"
      headerRight={
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-500">
          {total}건 대기
        </span>
      }
    >
      <ul className="space-y-1.5">
        {myTasks.map((t) => (
          <li key={t.label}>
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-neutral-50"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  t.urgent ? "bg-rose-50 text-rose-500" : "bg-seum-50 text-seum-600"
                }`}
              >
                <Icon name={t.icon} size={18} />
              </span>
              <span className="flex-1 text-sm text-neutral-700">{t.label}</span>
              <span
                className={`min-w-[28px] rounded-full px-2 py-0.5 text-center text-sm font-bold tabular-nums ${
                  t.count > 0
                    ? t.urgent
                      ? "bg-rose-500 text-white"
                      : "bg-seum-500 text-white"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {t.count}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
