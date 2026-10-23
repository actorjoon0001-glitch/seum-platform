/**
 * 기능 토글(플래그).
 * - 나중에 시행할 때 해당 값을 true로 바꾸면 기능이 다시 노출된다.
 */

/** 출퇴근(근태) 기능 노출 여부 — 공지 후 시행 예정이라 현재 숨김 */
export const ATTENDANCE_ENABLED = false;

/** 관리자 메뉴/페이지를 노출할 대표 계정 이메일 (이 계정에만 보임) */
export const OWNER_EMAIL = "harold0001@naver.com";

/** 해당 이메일이 대표(관리자 전용) 계정인지 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === OWNER_EMAIL;
}
