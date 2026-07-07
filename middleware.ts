import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 포털 인증 가드 + 세션 갱신.
 * - getUser() 로 세션을 검증하고 필요 시 토큰을 갱신한다.
 *   (갱신된 쿠키는 setAll 로 request/response 양쪽에 반영해야 로그아웃되지 않는다)
 * - /portal 이하는 로그인 사용자만 접근 (미로그인 → /login).
 * - 로그인 상태로 /login 접근 시 → /portal.
 * - 인증 환경변수(NEXT_PUBLIC_SUPABASE_*)가 없으면 게이트를 끄고 통과(배포 안전장치).
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 갱신된 토큰을 request(다운스트림)와 새 response 양쪽에 기록한다.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 리다이렉트 응답에도 갱신된 세션 쿠키를 반드시 복사한다(안 그러면 로그아웃).
  const redirectTo = (pathname: string) => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    const redirect = NextResponse.redirect(target);
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && path.startsWith("/portal")) return redirectTo("/login");
  if (user && path === "/login") return redirectTo("/portal");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
