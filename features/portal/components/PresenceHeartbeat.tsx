"use client";

import { useEffect } from "react";
import { useProfile } from "./PortalProvider";

/** 접속 신호(heartbeat) — 포털이 열려 있는 동안 user_presence.last_seen 갱신 */
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
        await supabase.from("user_presence").upsert(
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

  return null;
}
