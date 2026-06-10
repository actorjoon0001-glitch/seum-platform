import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";

/**
 * 그룹웨어 스타일 카드 셸.
 * 헤더(아이콘 + 제목 + 우측 영역) + 본문. 흰 배경 + 얇은 테두리.
 */
export function Card({
  title,
  icon,
  headerRight,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  icon?: IconName;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          {icon && <Icon name={icon} size={18} className="text-seum-600" />}
          {title}
        </h2>
        <div className="flex items-center gap-1 text-neutral-400">
          {headerRight}
          <button
            type="button"
            aria-label="새로고침"
            className="rounded p-1 transition hover:bg-neutral-100 hover:text-seum-600"
          >
            <Icon name="refresh" size={15} />
          </button>
        </div>
      </header>
      <div className={`flex-1 p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
