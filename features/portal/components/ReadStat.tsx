"use client";

import { useState } from "react";
import type { Reader } from "./reads";

/** 관리자 전용 읽음 통계 배지 — (전체/읽음) 표시, 클릭 시 읽은 사람 명단 */
export function ReadStat({ total, readers }: { total: number; readers: Reader[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="읽은 사람 보기"
        className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-neutral-500 transition hover:bg-seum-100 hover:text-seum-700"
      >
        {total}/{readers.length}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                읽은 사람 {readers.length}명
                <span className="ml-1 font-normal text-neutral-400">/ 전체 {total}명</span>
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            {readers.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">아직 읽은 사람이 없습니다.</p>
            ) : (
              <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                {readers
                  .slice()
                  .sort((a, b) => (a.read_at ?? "").localeCompare(b.read_at ?? ""))
                  .map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50"
                    >
                      <span className="min-w-0 truncate font-medium text-neutral-800">
                        {r.name ?? "-"}
                        {r.team && <span className="ml-1.5 text-xs text-neutral-400">{r.team}</span>}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                        {r.read_at ? r.read_at.slice(5, 16).replace("T", " ") : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
