/**
 * 읽음(열람) 기록 유틸.
 * - 공지사항: 기존 notice_reads 사용
 * - 세움소식/최근 업데이트: 공용 content_reads 사용 (content_type 으로 구분)
 * 관리자 분석(전체/읽음, 읽은 사람 명단)에 사용.
 */

export interface Reader {
  user_id: string | null;
  name: string | null;
  team: string | null;
  read_at: string | null;
}

async function client() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

/** 승인된 전체 직원 수 (분모) */
export async function getApprovedCount(): Promise<number> {
  try {
    const supabase = await client();
    const { count, error } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

/** 공지(notice_reads) 읽은 사람: notice_id → Reader[] */
export async function getNoticeReaders(ids: string[]): Promise<Record<string, Reader[]>> {
  const out: Record<string, Reader[]> = {};
  if (!ids.length) return out;
  try {
    const supabase = await client();
    const { data, error } = await supabase
      .from("notice_reads")
      .select("notice_id, user_id, user_name, department, read_at")
      .in("notice_id", ids);
    if (error) return out;
    for (const r of (data ?? []) as Record<string, string | null>[]) {
      const key = r.notice_id as string;
      (out[key] ??= []).push({
        user_id: r.user_id,
        name: r.user_name,
        team: r.department,
        read_at: r.read_at,
      });
    }
  } catch {
    /* noop */
  }
  return out;
}

/** 소식/업데이트(content_reads) 읽은 사람: content_id → Reader[] */
export async function getContentReaders(
  type: string,
  ids: string[],
): Promise<Record<string, Reader[]>> {
  const out: Record<string, Reader[]> = {};
  if (!ids.length) return out;
  try {
    const supabase = await client();
    const { data, error } = await supabase
      .from("content_reads")
      .select("content_id, user_id, user_name, user_team, read_at")
      .eq("content_type", type)
      .in("content_id", ids);
    if (error) return out;
    for (const r of (data ?? []) as Record<string, string | null>[]) {
      const key = r.content_id as string;
      (out[key] ??= []).push({
        user_id: r.user_id,
        name: r.user_name,
        team: r.user_team,
        read_at: r.read_at,
      });
    }
  } catch {
    /* noop */
  }
  return out;
}

/** 내가 읽은 content_reads 집합 (중복 기록 방지) */
export async function getMyContentReads(type: string): Promise<Set<string>> {
  try {
    const supabase = await client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Set();
    const { data } = await supabase
      .from("content_reads")
      .select("content_id")
      .eq("content_type", type)
      .eq("user_id", user.id);
    return new Set(((data ?? []) as { content_id: string }[]).map((r) => r.content_id));
  } catch {
    return new Set();
  }
}

/** 읽음 기록 (이미 읽었으면 skip). 성공 시 true */
export async function recordContentRead(
  type: string,
  id: string,
  name: string | null,
  team: string | null,
): Promise<boolean> {
  try {
    const supabase = await client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: exist } = await supabase
      .from("content_reads")
      .select("id")
      .eq("content_type", type)
      .eq("content_id", id)
      .eq("user_id", user.id)
      .limit(1);
    if (exist && exist.length) return false;
    const { error } = await supabase.from("content_reads").insert({
      content_type: type,
      content_id: id,
      user_id: user.id,
      user_name: name,
      user_team: team,
    } as never);
    return !error;
  } catch {
    return false;
  }
}
