/**
 * 세움 플랫폼 권한(역할) 정의.
 *
 * 실제 운영에서는 Supabase `members.role`(org별)로 결정되며,
 * 인증 도입 전까지는 헤더의 역할 스위처로 미리보기한다.
 */

export type Role =
  | "master"
  | "admin"
  | "sales"
  | "design"
  | "construction"
  | "finance"
  | "marketing";

export interface RoleMeta {
  id: Role;
  label: string;
  /** 모든 메뉴를 볼 수 있는 상위 권한 여부 */
  superuser?: boolean;
}

export const ROLES: RoleMeta[] = [
  { id: "master", label: "마스터", superuser: true },
  { id: "admin", label: "관리자", superuser: true },
  { id: "sales", label: "영업팀" },
  { id: "design", label: "설계팀" },
  { id: "construction", label: "시공팀" },
  { id: "finance", label: "정산팀" },
  { id: "marketing", label: "마케팅팀" },
];

export const DEFAULT_ROLE: Role = "master";

export function isSuperuser(role: Role): boolean {
  return ROLES.find((r) => r.id === role)?.superuser ?? false;
}

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}
