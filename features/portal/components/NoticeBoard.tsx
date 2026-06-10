"use client";

import { useState } from "react";
import { Card } from "./Card";
import { notices } from "../data/mock";
import type { NoticeTeam } from "../data/mock";

const TABS: NoticeTeam[] = ["전체", "영업팀", "설계팀", "시공팀"];

/** 2열 — 공지사항 (팀별 탭, 최근 10개) */
export function NoticeBoard() {
  const [tab, setTab] = useState<NoticeTeam>("전체");

  const list = (tab === "전체" ? notices : notices.filter((n) => n.team === tab)).slice(
    0,
    10,
  );

  return (
    <Card title="공지사항" icon="notice">
      <div className="-mt-1 mb-2 flex gap-4 border-b border-neutral-100 text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 transition ${
              tab === t
                ? "border-seum-500 font-semibold text-seum-600"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-neutral-100">
        {list.map((n) => (
          <li key={n.id}>
            <a
              href="#"
              className="flex items-center gap-2 py-2 text-sm transition hover:text-seum-600"
            >
              {n.pinned && (
                <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                  중요
                </span>
              )}
              {tab === "전체" && n.team !== "전체" && (
                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                  {n.team}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-neutral-700">{n.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                {n.date.slice(5)}
              </span>
            </a>
          </li>
        ))}
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-400">공지가 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
