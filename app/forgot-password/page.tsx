"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 비밀번호 찾기 — 재설정 메일 발송.
 * 메일의 링크를 누르면 /reset-password 에서 새 비밀번호를 설정한다.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(`${error.message}${error.status ? ` (${error.status})` : ""}`);
        return;
      }
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`설정 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2ef] px-4 text-neutral-800 [color-scheme:light]">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-seum-500 text-xl font-extrabold text-white shadow-sm">
            세
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">비밀번호 찾기</h1>
          <p className="mt-1 text-xs text-neutral-400">
            가입한 이메일로 재설정 링크를 보내드립니다.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-neutral-700">
                <span className="font-semibold">{email}</span> 으로
                <br />
                재설정 메일을 보냈습니다.
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                메일의 링크를 눌러 새 비밀번호를 설정해 주세요. (메일이 안 보이면 스팸함도 확인)
              </p>
              <Link
                href="/login"
                className="mt-5 inline-block w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <label className="mb-1 block text-sm font-medium text-neutral-700">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@seum.co.kr"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
              />

              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
              >
                {loading ? "전송 중…" : "재설정 메일 보내기"}
              </button>

              <Link
                href="/login"
                className="mt-3 block text-center text-xs text-neutral-400 transition hover:text-seum-600"
              >
                로그인으로 돌아가기
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
