import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * 브라우저(Client Component)용 Supabase 클라이언트.
 * anon key 사용 → 모든 접근은 RLS로 보호된다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
