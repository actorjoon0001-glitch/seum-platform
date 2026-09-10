"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "./Card";
import { useProfile } from "./PortalProvider";

interface NewsRow {
  id: string;
  category: string | null;
  title: string;
  content: string | null;
  created_at: string | null;
  created_by_name: string | null;
  created_by_team: string | null;
}

const BASE_COLS = "id, category, title, created_at";
const FULL_COLS = "id, category, title, content, created_at, created_by_name, created_by_team";

const CATEGORIES = ["소식", "보도", "이야기"];
const CATEGORY_STYLE: Record<string, string> = {
  소식: "bg-seum-100 text-seum-700",
  보도: "bg-indigo-100 text-indigo-700",
  이야기: "bg-amber-100 text-amber-700",
};
const catStyle = (c: string | null) =>
  CATEGORY_STYLE[c ?? "소식"] ?? "bg-neutral-100 text-neutral-600";

/** 세움 소식 — company_news 실데이터. 누구나 글쓰기, 삭제는 admin/master. */
export function CompanyNews() {
  const { profile } = useProfile();
  const isAdmin = ["admin", "master"].includes(profile?.permission ?? "");

  const [rows, setRows] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<NewsRow | null>(null);

  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("소식");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      let res = await supabase
        .from("company_news")
        .select(FULL_COLS)
        .order("created_at", { ascending: false })
        .limit(20);
      if (res.error) {
        res = await supabase
          .from("company_news")
          .select(BASE_COLS)
          .order("created_at", { ascending: false })
          .limit(20);
      }
      setRows(res.error ? [] : ((res.data ?? []) as NewsRow[]));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addNews() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const full = {
        category,
        title: title.trim(),
        content: content.trim() || null,
        created_by_name: profile?.name ?? null,
        created_by_team: profile?.team ?? null,
      };
      let res = await supabase.from("company_news").insert(full as never);
      if (res.error) {
        // content/작성자 컬럼이 아직 없으면 최소 필드로 재시도
        res = await supabase
          .from("company_news")
          .insert({ category, title: title.trim() } as never);
      }
      if (res.error) throw res.error;
      setTitle("");
      setContent("");
      setCategory("소식");
      setAdding(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeNews(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("company_news").delete().eq("id", id);
    setViewing(null);
    await load();
  }

  return (
    <Card
      title="세움 소식"
      icon="notice"
      headerRight={
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-seum-600"
        >
          {adding ? "닫기" : "+ 글쓰기"}
        </button>
      }
    >
      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용 (선택) — 자세한 소식을 적어주세요"
            rows={3}
            className="w-full resize-y rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-seum-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addNews}
              disabled={saving}
              className="rounded-md bg-seum-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-seum-600 disabled:opacity-60"
            >
              {saving ? "저장…" : "등록"}
            </button>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}

      <ul className="divide-y divide-neutral-100">
        {rows.map((n) => (
          <li key={n.id} className="group flex items-center gap-2 py-2.5 text-sm">
            <button
              type="button"
              onClick={() => setViewing(n)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${catStyle(n.category)}`}
              >
                {n.category ?? "소식"}
              </span>
              <span className="min-w-0 flex-1 truncate text-neutral-700 transition group-hover:text-seum-600">
                {n.title}
              </span>
              {n.created_by_team && (
                <span className="hidden shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 sm:inline">
                  {n.created_by_team}
                </span>
              )}
              {n.created_by_name && (
                <span className="hidden shrink-0 text-[11px] text-neutral-400 sm:inline">
                  {n.created_by_name}
                </span>
              )}
              <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                {n.created_at ? n.created_at.slice(5, 10) : ""}
              </span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => removeNews(n.id)}
                aria-label="삭제"
                className="shrink-0 text-neutral-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}
        {loading && <li className="py-8 text-center text-sm text-neutral-400">불러오는 중…</li>}
        {!loading && rows.length === 0 && (
          <li className="py-8 text-center text-sm text-neutral-400">등록된 소식이 없습니다.</li>
        )}
      </ul>

      {viewing && (
        <NewsViewer
          news={viewing}
          canDelete={isAdmin}
          onDelete={() => removeNews(viewing.id)}
          onClose={() => setViewing(null)}
        />
      )}
    </Card>
  );
}

/** 세움 소식 상세 뷰어 */
function NewsViewer({
  news,
  canDelete,
  onDelete,
  onClose,
}: {
  news: NewsRow;
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${catStyle(news.category)}`}
            >
              {news.category ?? "소식"}
            </span>
            <h3 className="mt-1.5 text-lg font-bold leading-snug text-neutral-900">{news.title}</h3>
            <p className="mt-1 text-xs text-neutral-400">
              {[news.created_by_team, news.created_by_name, news.created_at]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {news.content ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {news.content}
          </p>
        ) : (
          <p className="text-sm text-neutral-400">추가 내용이 없습니다.</p>
        )}

        {canDelete && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
