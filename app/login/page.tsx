"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const REMEMBER_KEY = "seum_remember_email";

/**
 * 세움 플랫폼 로그인.
 * 세움OS와 동일한 Supabase 프로젝트로 인증하므로, 직원은 기존 세움OS
 * 계정(이메일/비밀번호)으로 그대로 로그인한다.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 자동 로그인(이메일 기억): 저장된 이메일이 있으면 미리 채운다.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(`${error.message}${error.status ? ` (${error.status})` : ""}`);
        return;
      }
      // 관리자 승인(approved)된 직원만 로그인 허용 (세움OS와 동일)
      const uid = data.user?.id;
      if (uid) {
        const emp = await supabase
          .from("employees")
          .select("status")
          .eq("auth_user_id", uid)
          .maybeSingle();
        const status = (emp.data as { status?: string } | null)?.status;
        if (!emp.error && status && status !== "approved") {
          await supabase.auth.signOut();
          setError("가입 승인 대기 중입니다. 관리자 승인 후 이용할 수 있습니다.");
          return;
        }
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      router.push("/portal");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`로그인 설정 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2ef] px-4 text-neutral-800 [color-scheme:light]">
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
            className="mb-4 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="비밀번호"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
          />

          <div className="mt-3 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-neutral-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-seum-600 focus:ring-seum-500"
              />
              자동 로그인
            </label>
            <Link
              href="/forgot-password"
              className="text-neutral-500 transition hover:text-seum-600"
            >
              비밀번호 찾기
            </Link>
          </div>

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
          <p className="mt-2 text-center text-xs text-neutral-500">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-seum-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
