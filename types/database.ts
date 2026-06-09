/**
 * Supabase 생성 타입 자리표시자.
 *
 * 실제 타입은 마이그레이션 적용 후 아래 명령으로 생성한다:
 *   npm run db:types
 * (supabase gen types typescript → 이 파일을 덮어씀)
 *
 * 지금은 스키마가 없으므로 느슨한 타입으로 두어 빌드가 가능하게 한다.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
