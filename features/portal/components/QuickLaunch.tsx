"use client";

import Link from "next/link";
import { Icon } from "./icons";
import { useRole } from "./PortalProvider";
import { quickMenu } from "../config/menu";

/** 빠른 실행 메뉴 — 아이콘 카드 (역할별 노출) */
export function QuickLaunch() {
  const { role } = useRole();
  const items = quickMenu(role);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="grid" size={18} className="text-seum-600" />
        <h2 className="text-sm font-semibold text-neutral-800">빠른 실행</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {items.map((m) => (
          <Link
            key={m.key}
            href={m.href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50/60 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-seum-200 hover:bg-seum-50 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-seum-600 shadow-sm ring-1 ring-neutral-100 transition group-hover:bg-seum-500 group-hover:text-white group-hover:ring-seum-500">
              <Icon name={m.icon} size={24} />
            </span>
            <span className="text-xs font-medium text-neutral-700">{m.label}</span>
            {m.desc && (
              <span className="text-[10px] leading-tight text-neutral-400">{m.desc}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
