import { z } from "zod";

/**
 * 환경변수 검증 (단일 출처)
 * - 클라이언트에 노출되는 값은 NEXT_PUBLIC_ 접두사만 사용한다.
 * - SERVICE_ROLE 키는 절대 클라이언트 번들에 들어가면 안 된다(서버 전용).
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

/** 브라우저/서버 공통으로 안전하게 쓰는 공개 환경값 */
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * 서버 전용 환경값. 서버 모듈(`lib/supabase/admin.ts` 등)에서만 호출.
 * 클라이언트에서 import 하면 빌드 시 SERVICE_ROLE 누락으로 실패하므로 방어가 된다.
 */
export function getServerEnv() {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
