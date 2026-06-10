import type { ReactElement, SVGProps } from "react";

/**
 * 의존성 없는 인라인 SVG 아이콘 세트 (stroke 기반, 24x24).
 * 메뉴/KPI/알림 등 포털 전반에서 사용한다.
 */

export type IconName =
  // 메뉴/서비스
  | "call"
  | "contract"
  | "catalog"
  | "design"
  | "construction"
  | "finance"
  | "worklog"
  | "notice"
  | "org"
  // KPI
  | "won"
  | "chart"
  | "calendar"
  | "site"
  // 알림/유틸
  | "inquiry"
  | "visit"
  | "deal"
  | "check"
  | "bell"
  | "refresh"
  | "search"
  | "grid"
  | "star"
  | "expand"
  | "logout"
  | "chevron"
  | "clock"
  | "task"
  | "home"
  | "manual"
  | "archive"
  | "update"
  | "hub"
  | "meeting"
  | "holiday"
  | "arrow";

const PATHS: Record<IconName, ReactElement> = {
  call: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  contract: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  catalog: (
    <>
      <path d="M2 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
      <path d="M22 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />
    </>
  ),
  design: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7M12 11v10" />
    </>
  ),
  construction: (
    <>
      <path d="M2 20h20M4 20V10l8-5 8 5v10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  finance: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h2m4 0h2M8 13h2m4 0h2M8 17h8" />
    </>
  ),
  worklog: (
    <>
      <path d="M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1z" />
      <path d="M9 13l2 2 4-4" />
    </>
  ),
  notice: (
    <>
      <path d="M3 11l15-6v14L3 13z" />
      <path d="M3 11v2a2 2 0 0 0 2 2h1M8 15v4a1 1 0 0 0 1 1h1" />
    </>
  ),
  org: (
    <>
      <circle cx="12" cy="6" r="3" />
      <circle cx="5" cy="18" r="3" />
      <circle cx="19" cy="18" r="3" />
      <path d="M12 9v3M12 12H5v3M12 12h7v3" />
    </>
  ),
  won: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 9l2 6 3-7 3 7 2-6" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  site: (
    <>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-5h6v5M9 11h.01M15 11h.01" />
    </>
  ),
  inquiry: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 8v3M12 14h.01" />
    </>
  ),
  visit: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  deal: (
    <>
      <path d="M20 6L9 17l-5-5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  star: (
    <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z" />
  ),
  expand: (
    <path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3m0-8V5a2 2 0 0 0-2-2h-3" />
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  task: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  manual: (
    <>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M9 4v14M12 8h3M12 11h3" />
    </>
  ),
  archive: (
    <>
      <path d="M3 7h18v13H3z" />
      <path d="M3 7l2-3h14l2 3M9 12h6" />
    </>
  ),
  update: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V9M9 12l3-3 3 3" />
    </>
  ),
  hub: (
    <>
      <path d="M12 3l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </>
  ),
  meeting: (
    <>
      <path d="M7 8h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2l-3 3v-3H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z" />
      <path d="M9 12h6" />
    </>
  ),
  holiday: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
