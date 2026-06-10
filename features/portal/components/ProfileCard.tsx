"use client";

import { Card } from "./Card";
import { Icon } from "./icons";
import { useRole } from "./PortalProvider";
import { roleLabel } from "../config/roles";
import { profile } from "../data/mock";

/** 프로필 요약 카드 (대시보드 우측 상단) */
export function ProfileCard() {
  const { role } = useRole();

  return (
    <Card title="내 정보" icon="org">
      <div className="flex flex-col items-center pb-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-seum-100 text-2xl font-bold text-seum-700">
          {profile.name.slice(1, 2)}
        </span>
        <p className="mt-2 text-base font-bold text-neutral-900">
          {profile.name} {profile.rank}
        </p>
        <p className="text-xs text-neutral-500">
          {profile.dept} · {roleLabel(role)}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-seum-50 px-2.5 py-1 text-xs font-medium text-seum-600">
          <span className="h-1.5 w-1.5 rounded-full bg-seum-500" />
          {profile.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
        <a
          href="#"
          className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 transition hover:bg-seum-50"
        >
          <span className="flex items-center gap-2 text-sm text-neutral-600">
            <Icon name="contract" size={16} className="text-seum-600" />
            결재
          </span>
          <span className="rounded-full bg-seum-500 px-2 text-xs font-bold text-white">
            {profile.pendingApproval}
          </span>
        </a>
        <a
          href="#"
          className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 transition hover:bg-seum-50"
        >
          <span className="flex items-center gap-2 text-sm text-neutral-600">
            <Icon name="bell" size={16} className="text-seum-600" />
            쪽지
          </span>
          <span className="rounded-full bg-rose-500 px-2 text-xs font-bold text-white">
            {profile.unreadMessages}
          </span>
        </a>
      </div>
    </Card>
  );
}
