"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 새 비밀번호 설정.
 * 비밀번호 찾기 메일의 링크로 진입하면 임시 세션이 생기고,
 * 여기서 새 비밀번호를 저장한다.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null); // null=확인중
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 메일 링크의 인증 정보를 세션으로 확보
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const code = new URL(window.location.href).searchParams.get("code");
        let { data } = await supabase.auth.getSession();
        if (!data.session && code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch {
            // 이미 교환됐거나 만료
          }
          data = (await supabase.auth.getSession()).data;
        }
        setReady(!!data.session);
      } catch {
        setReady(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(`${error.message}${error.status ? ` (${error.status})` : ""}`);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/portal");
        router.refresh();
      }, 1500);
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
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">새 비밀번호 설정</h1>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {ready === null ? (
            <p className="text-center text-sm text-neutral-500">확인 중…</p>
          ) : ready === false ? (
            <div className="text-center">
              <p className="text-sm text-neutral-700">유효하지 않거나 만료된 링크입니다.</p>
              <Link
                href="/forgot-password"
                className="mt-5 inline-block w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600"
              >
                재설정 메일 다시 받기
              </Link>
            </div>
          ) : done ? (
            <p className="text-center text-sm text-neutral-700">
              비밀번호가 변경되었습니다. 잠시 후 포털로 이동합니다…
            </p>
          ) : (
            <form onSubmit={onSubmit}>
              <label className="mb-1 block text-sm font-medium text-neutral-700">새 비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="6자 이상"
                className="mb-4 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
              />
              <label className="mb-1 block text-sm font-medium text-neutral-700">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="다시 입력"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-seum-500 focus:ring-2 focus:ring-seum-100"
              />

              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-lg bg-seum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:opacity-60"
              >
                {loading ? "변경 중…" : "비밀번호 변경"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
