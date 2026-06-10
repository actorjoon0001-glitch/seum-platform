import { Card } from "./Card";
import { CalendarWidget } from "./CalendarWidget";
import { todaySchedule } from "../data/mock";
import type { ScheduleType } from "../data/mock";

const TYPE_STYLE: Record<ScheduleType, string> = {
  방문예약: "bg-amber-100 text-amber-700",
  회의: "bg-slate-100 text-slate-700",
  계약: "bg-seum-100 text-seum-700",
  설계: "bg-blue-100 text-blue-700",
  시공: "bg-violet-100 text-violet-700",
  휴무: "bg-neutral-100 text-neutral-500",
};

/** 오늘 일정 + 월간 캘린더 */
export function TodaySchedule() {
  return (
    <Card
      title="오늘 일정"
      icon="calendar"
      headerRight={
        <span className="rounded-full bg-seum-50 px-2 py-0.5 text-xs font-medium text-seum-600">
          {todaySchedule.length}건
        </span>
      }
    >
      <CalendarWidget />
      <ul className="mt-3 space-y-2">
        {todaySchedule.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-neutral-100 px-3 py-2 transition hover:border-seum-200 hover:bg-seum-50/40"
          >
            <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-neutral-500">
              {s.time}
            </span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_STYLE[s.type]}`}
            >
              {s.type}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-neutral-800">{s.title}</p>
              <p className="truncate text-[11px] text-neutral-400">{s.place}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
