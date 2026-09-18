"use client";

import { useCallback, useEffect, useState } from "react";
import { useProfile } from "./PortalProvider";

interface Attendance {
  check_in: string | null;
  check_out: string | null;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
const hhmm = (ts: string | null) =>
  ts
    ? new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

/** 오늘 근태 — 출근/퇴근 기록 (attendance 테이블) */
export function AttendanceWidget() {
  const { profile } = useProfile();
  const [row, setRow] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await supabase
        .from("attendance")
        .select("check_in, check_out")
        .eq("user_id", user.id)
        .eq("work_date", todayStr())
        .maybeSingle();
      setRow(res.error ? null : ((res.data ?? null) as Attendance | null));
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkIn() {
    setBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await supabase.from("attendance").upsert(
        {
          user_id: user.id,
          work_date: todayStr(),
          check_in: new Date().toISOString(),
          name: profile?.name ?? null,
          team: profile?.team ?? null,
        } as never,
        { onConflict: "user_id,work_date" },
      );
      if (res.error) throw res.error;
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "출근 처리 실패");
    } finally {
      setBusy(false);
    }
  }

  async function checkOut() {
    setBusy(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await supabase
        .from("attendance")
        .update({ check_out: new Date().toISOString() } as never)
        .eq("user_id", user.id)
        .eq("work_date", todayStr());
      if (res.error) throw res.error;
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "퇴근 처리 실패");
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = !!row?.check_in;
  const checkedOut = !!row?.check_out;

  let status: string;
  if (checkedOut) status = `퇴근 · ${hhmm(row!.check_in)}~${hhmm(row!.check_out)}`;
  else if (checkedIn) status = `근무 중 · ${hhmm(row!.check_in)} 출근`;
  else status = "출근 전";

  return (
    <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500">오늘 근무</span>
        <span
          className={`text-xs font-medium tabular-nums ${
            checkedOut ? "text-neutral-500" : checkedIn ? "text-seum-600" : "text-neutral-400"
          }`}
        >
          {loading ? "…" : status}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={checkIn}
          disabled={busy || checkedIn}
          className="flex-1 rounded-md bg-seum-500 py-2 text-sm font-semibold text-white transition hover:bg-seum-600 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          출근하기
        </button>
        <button
          type="button"
          onClick={checkOut}
          disabled={busy || !checkedIn || checkedOut}
          className="flex-1 rounded-md bg-rose-500 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          퇴근하기
        </button>
      </div>
    </div>
  );
}
