"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { scheduleDays } from "../data/mock";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
/** 데모 기준일 (오늘) */
const TODAY = new Date(2026, 5, 10);

/** 미니 캘린더 위젯 — 일정 있는 날 점 표시 + 오늘 강조 */
export function CalendarWidget() {
  const [view, setView] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth =
    year === TODAY.getFullYear() && month === TODAY.getMonth();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) =>
    setView(new Date(year, month + delta, 1));

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="이전 달"
          className="rounded p-1 text-neutral-400 hover:bg-white hover:text-seum-600"
        >
          <Icon name="chevron" size={16} className="rotate-90" />
        </button>
        <span className="text-sm font-semibold text-neutral-800">
          {year}. {String(month + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="다음 달"
          className="rounded p-1 text-neutral-400 hover:bg-white hover:text-seum-600"
        >
          <Icon name="chevron" size={16} className="-rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEK.map((w, i) => (
          <span
            key={w}
            className={
              i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-neutral-400"
            }
          >
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const isToday = isCurrentMonth && d === TODAY.getDate();
          const hasEvent = isCurrentMonth && scheduleDays.includes(d);
          const dow = i % 7;
          return (
            <span key={d} className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                  isToday
                    ? "bg-seum-500 font-bold text-white"
                    : dow === 0
                      ? "text-rose-500"
                      : dow === 6
                        ? "text-blue-500"
                        : "text-neutral-700"
                }`}
              >
                {d}
              </span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  hasEvent ? "bg-seum-400" : "bg-transparent"
                }`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
