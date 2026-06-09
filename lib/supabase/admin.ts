import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * ⚠️ 서버 전용 관리자 클라이언트 (service_role).
 * - RLS를 우회하므로 멤버 초대/권한 변경 등 관리 작업에만 사용.
 * - `server-only` import로 클라이언트 번들 유입을 차단한다.
 * - 사용 시 반드시 코드에서 org 컨텍스트/권한을 수동 검증할 것.
 */
export function createAdminClient() {
  const env = getServerEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
