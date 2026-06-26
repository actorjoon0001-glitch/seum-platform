"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "./Card";

interface Announcement {
  id: string;
  title: string | null;
  created_at: string | null;
  important: boolean | null;
  is_new: boolean | null;
  created_by_name: string | null;
  created_by_team: string | null;
}

/** 공지사항 — 세움OS announcements 실제 데이터, 팀 탭(자동), 최신순 */
export function NoticeBoard() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("전체");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const res = await supabase
          .from("announcements")
          .select("id, title, created_at, important, is_new, created_by_name, created_by_team")
          .order("created_at", { ascending: false })
          .limit(30);
        if (!active) return;
        if (res.error) {
          setError(true);
        } else {
          setRows((res.data ?? []) as Announcement[]);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 데이터에 존재하는 팀으로 탭 자동 구성
  const tabs = useMemo(() => {
    const teams = Array.from(
      new Set(rows.map((r) => r.created_by_team).filter((t): t is string => !!t)),
    );
    return ["전체", ...teams];
  }, [rows]);

  const list = (tab === "전체" ? rows : rows.filter((r) => r.created_by_team === tab)).slice(
    0,
    10,
  );

  return (
    <Card title="공지사항" icon="notice">
      <div className="-mt-1 mb-2 flex flex-wrap gap-x-4 gap-y-1 border-b border-neutral-100 text-sm">
        {tabs.map((t) => (
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
            <a href="#" className="group flex items-center gap-2 py-2.5 text-sm">
              {n.important && (
                <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                  중요
                </span>
              )}
              {n.is_new && (
                <span className="shrink-0 rounded bg-seum-50 px-1.5 py-0.5 text-[10px] font-bold text-seum-600">
                  NEW
                </span>
              )}
              {tab === "전체" && n.created_by_team && (
                <span className="hidden shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline">
                  {n.created_by_team}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate font-medium text-neutral-800 transition group-hover:text-seum-600">
                {n.title ?? "(제목 없음)"}
              </span>
              <span className="hidden shrink-0 text-xs text-neutral-400 sm:inline">
                {n.created_by_name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                {n.created_at ? n.created_at.slice(5) : ""}
              </span>
            </a>
          </li>
        ))}

        {loading && (
          <li className="py-8 text-center text-sm text-neutral-400">공지를 불러오는 중…</li>
        )}
        {!loading && error && (
          <li className="py-8 text-center text-sm text-neutral-400">
            공지를 불러올 수 없습니다.
          </li>
        )}
        {!loading && !error && list.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-400">공지가 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}
