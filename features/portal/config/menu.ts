import type { Role } from "./roles";
import { isSuperuser } from "./roles";
import type { IconName } from "../components/icons";

/**
 * 세움 플랫폼 통합 메뉴 정의 (단일 출처).
 *
 * 각 메뉴는 독립적인 웹서비스다. 메인 포털은 통합 진입점 역할만 한다.
 * - `href`가 `/portal/app/{key}` 형태면 내부 iframe 래퍼로 진입.
 * - `external: true`면 새 탭으로 외부 서비스 진입.
 * - `roles`가 비어있으면 전체 공개. 마스터/관리자는 항상 전체 노출.
 */

export type ServiceKey =
  | "call"
  | "contract"
  | "catalog"
  | "design"
  | "construction"
  | "finance"
  | "worklog"
  | "notice"
  | "org";

export interface MenuItem {
  key: ServiceKey;
  label: string;
  /** 진입 경로 (내부 iframe 래퍼 기본) */
  href: string;
  /** 외부 서비스 실제 URL (iframe src / 새 탭 대상) */
  serviceUrl?: string;
  /** 서비스가 실제 연결되었는지 (false면 "연결 준비중" 표시) */
  ready: boolean;
  /** true면 새 탭, false/undefined면 내부 iframe */
  external?: boolean;
  /** 노출 허용 역할 (비우면 전체) */
  roles?: Role[];
  icon: IconName;
  /** 빠른 실행 카드에 노출할지 */
  quick?: boolean;
  /** 한 줄 설명 (빠른 실행 카드용) */
  desc?: string;
}

export const MENU: MenuItem[] = [
  {
    key: "call",
    label: "Call OS",
    href: "/portal/app/call",
    serviceUrl: "https://call.seum.example.com",
    ready: false,
    icon: "call",
    quick: true,
    desc: "인입 콜·문의 관리",
    roles: ["sales", "marketing"],
  },
  {
    key: "contract",
    label: "계약서OS",
    href: "/portal/app/contract",
    serviceUrl: "https://contract.seum.example.com",
    ready: false,
    icon: "contract",
    quick: true,
    desc: "계약 작성·전자서명",
    roles: ["sales", "finance"],
  },
  {
    key: "catalog",
    label: "온라인카탈로그",
    href: "/portal/app/catalog",
    serviceUrl: "https://catalog.seum.example.com",
    ready: false,
    icon: "catalog",
    quick: true,
    desc: "모델·옵션 카탈로그",
  },
  {
    key: "design",
    label: "설계OS",
    href: "/portal/app/design",
    serviceUrl: "https://design.seum.example.com",
    ready: false,
    icon: "design",
    quick: true,
    desc: "3D 설계·도면",
    roles: ["design"],
  },
  {
    key: "construction",
    label: "시공OS",
    href: "/portal/app/construction",
    serviceUrl: "https://build.seum.example.com",
    ready: false,
    icon: "construction",
    quick: true,
    desc: "현장 공정·사진",
    roles: ["construction"],
  },
  {
    key: "finance",
    label: "정산OS",
    href: "/portal/app/finance",
    serviceUrl: "https://finance.seum.example.com",
    ready: false,
    icon: "finance",
    quick: true,
    desc: "수금·정산·매출",
    roles: ["finance"],
  },
  {
    key: "worklog",
    label: "업무일지",
    href: "/portal/app/worklog",
    serviceUrl: "https://worklog.seum.example.com",
    ready: false,
    icon: "worklog",
    desc: "일일 업무 기록",
  },
  {
    key: "notice",
    label: "공지사항",
    href: "/portal/app/notice",
    serviceUrl: "https://notice.seum.example.com",
    ready: false,
    icon: "notice",
    desc: "전사·팀 공지",
  },
  {
    key: "org",
    label: "조직도",
    href: "/portal/app/org",
    serviceUrl: "https://org.seum.example.com",
    ready: false,
    icon: "org",
    desc: "구성원·연락처",
  },
];

/** 역할에 따라 노출 가능한 메뉴만 필터링 */
export function visibleMenu(role: Role): MenuItem[] {
  if (isSuperuser(role)) return MENU;
  return MENU.filter((m) => !m.roles || m.roles.includes(role));
}

/** 빠른 실행 카드용 메뉴 (역할 필터 적용) */
export function quickMenu(role: Role): MenuItem[] {
  return visibleMenu(role).filter((m) => m.quick);
}

export function findService(key: string): MenuItem | undefined {
  return MENU.find((m) => m.key === key);
}
