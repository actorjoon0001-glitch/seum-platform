import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * 서버(Server Component / Route Handler / Server Action)용 클라이언트.
 * 쿠키 기반 세션을 사용하며 anon key + RLS로 동작한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우 set이 무시될 수 있음 (정상)
          }
        },
      },
    },
  );
}
