"use client";

import { useEffect } from "react";
import { useProfile } from "./PortalProvider";

/** 접속 신호(heartbeat) — 포털이 열려 있는 동안 portal_presence.last_seen 갱신 */
export function PresenceHeartbeat() {
  const { profile } = useProfile();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    async function beat() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || stopped) return;
        await supabase.from("portal_presence").upsert(
          {
            user_id: user.id,
            name: profile?.name ?? null,
            team: profile?.team ?? null,
            last_seen: new Date().toISOString(),
          } as never,
          { onConflict: "user_id" },
        );
      } catch {
        /* 무시 */
      }
    }

    beat();
    timer = setInterval(beat, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [profile?.name, profile?.team]);

  // 접속 기록(방문 로그) — 앱 진입 시 1회, 최근 30분 내 기록 있으면 생략
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const recent = await supabase
          .from("login_events")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .limit(1);
        if ((recent.data?.length ?? 0) > 0 || cancelled) return;
        // 이름·팀 스냅샷 확보
        let name = profile?.name ?? null;
        let team = profile?.team ?? null;
        if (!name) {
          const emp = await supabase
            .from("employees")
            .select("name, team")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          name = (emp.data as { name?: string } | null)?.name ?? null;
          team = (emp.data as { team?: string } | null)?.team ?? null;
        }
        await supabase
          .from("login_events")
          .insert({ user_id: user.id, name, team } as never);
      } catch {
        /* 무시 */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
