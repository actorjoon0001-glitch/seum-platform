"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 세움 플랫폼 로그인.
 * 세움OS와 동일한 Supabase 프로젝트로 인증하므로, 직원은 기존 세움OS
 * 계정(이메일/비밀번호)으로 그대로 로그인한다.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("로그인 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2ef] px-4 text-neutral-800">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-seum-500 text-xl font-extrabold text-white shadow-sm">
            세
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">
            세움<span className="text-seum-600"> 플랫폼</span>
          </h1>
          <p className="mt-1 text-xs text-neutral-400">세움디자인하우징 통합 업무 포털</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <label className="mb-1 block text-sm font-medium text-neutral-700">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="name@seum.co.kr"
            className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="비밀번호"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
          />

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>

          <p className="mt-4 text-center text-xs text-neutral-400">
            세움OS 계정(이메일/비밀번호)으로 로그인하세요.
          </p>
        </form>
      </div>
    </main>
  );
}
