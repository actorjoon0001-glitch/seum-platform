"use client";

import { Card } from "./Card";
import { Icon } from "./icons";
import { useRole } from "./PortalProvider";
import { roleLabel } from "../config/roles";
import { profile } from "../data/mock";

/** 내 정보 — 프로필 + 출근 상태 + 최근 로그인 + 미확인 공지/알림 */
export function MyInfoCard() {
  const { role } = useRole();

  return (
    <Card title="내 정보" icon="org">
      <div className="flex items-center gap-3 pb-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-seum-100 text-xl font-bold text-seum-700">
          {profile.name.slice(1, 2)}
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-neutral-900">
            {profile.name} {profile.rank}
          </p>
          <p className="text-xs text-neutral-500">
            {profile.dept} · {roleLabel(role)}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-seum-50 px-2 py-0.5 text-[11px] font-medium text-seum-600">
            <span className="h-1.5 w-1.5 rounded-full bg-seum-500" />
            {profile.status}
          </span>
        </div>
      </div>

      <dl className="space-y-2 border-t border-neutral-100 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-neutral-500">
            <Icon name="clock" size={15} className="text-neutral-400" />
            최근 로그인
          </dt>
          <dd className="tabular-nums text-neutral-700">{profile.lastLogin}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-neutral-500">
            <Icon name="notice" size={15} className="text-neutral-400" />
            미확인 공지
          </dt>
          <dd>
            <span className="rounded-full bg-seum-500 px-2 py-0.5 text-xs font-bold text-white">
              {profile.unreadNotices}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-neutral-500">
            <Icon name="bell" size={15} className="text-neutral-400" />
            알림
          </dt>
          <dd>
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
              {profile.alertCount}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
