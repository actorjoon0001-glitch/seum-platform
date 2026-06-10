import type { IconName } from "../components/icons";

/**
 * 상단 헤더 네비게이션 (회사 포털 공통 메뉴).
 * 업무 시스템 진입은 메인의 "자주 사용하는 시스템" 런처가 담당하고,
 * 여기는 포털 공통 메뉴(공지/매뉴얼/조직도/일정/자료실/업데이트)만 둔다.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export const NAV_MENU: NavItem[] = [
  { label: "홈", href: "/portal", icon: "home" },
  { label: "공지사항", href: "/portal#notices", icon: "notice" },
  { label: "업무 매뉴얼", href: "/portal/app/manual", icon: "manual" },
  { label: "조직도", href: "/portal/app/org", icon: "org" },
  { label: "일정관리", href: "/portal#schedule", icon: "calendar" },
  { label: "자료실", href: "/portal/app/archive", icon: "archive" },
  { label: "업데이트 내역", href: "/portal#updates", icon: "update" },
];
