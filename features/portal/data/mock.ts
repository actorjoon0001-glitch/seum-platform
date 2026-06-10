import type { IconName } from "../components/icons";

/**
 * 포털 대시보드 목 데이터.
 *
 * 실제 운영에서는 Supabase 테이블/뷰에서 조회한다(고객/계약/공지/일정/알림).
 * 스키마 도입 전까지 UI/레이아웃 검증용 시드로 사용한다.
 */

export interface Profile {
  name: string;
  rank: string;
  dept: string;
  status: "출근" | "외근" | "휴가" | "퇴근";
  pendingApproval: number;
  unreadMessages: number;
}

export const profile: Profile = {
  name: "박세움",
  rank: "선임",
  dept: "영업1팀",
  status: "출근",
  pendingApproval: 3,
  unreadMessages: 2,
};

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  delta?: { dir: "up" | "down"; text: string };
  icon: IconName;
  tone: "green" | "blue" | "amber" | "violet";
}

export const kpis: Kpi[] = [
  {
    label: "오늘 계약금 합계",
    value: "₩ 32,500,000",
    sub: "계약 3건",
    delta: { dir: "up", text: "전일 +12%" },
    icon: "won",
    tone: "green",
  },
  {
    label: "이번달 매출",
    value: "₩ 12.8억",
    sub: "목표 대비 84%",
    delta: { dir: "up", text: "전월 +8.4%" },
    icon: "chart",
    tone: "blue",
  },
  {
    label: "방문예약 수",
    value: "14건",
    sub: "오늘 4건 예정",
    delta: { dir: "up", text: "이번주 +5" },
    icon: "calendar",
    tone: "amber",
  },
  {
    label: "진행중 현장 수",
    value: "23곳",
    sub: "준공 임박 5곳",
    delta: { dir: "down", text: "전월 -2" },
    icon: "site",
    tone: "violet",
  },
];

export type ScheduleType = "방문예약" | "계약" | "설계" | "시공";

export interface ScheduleItem {
  time: string;
  type: ScheduleType;
  title: string;
  place: string;
}

export const todaySchedule: ScheduleItem[] = [
  { time: "09:30", type: "방문예약", title: "김민수 고객 모델하우스 방문", place: "본사 전시동" },
  { time: "11:00", type: "계약", title: "이정훈 고객 본계약 체결", place: "상담실 2" },
  { time: "13:30", type: "설계", title: "양평 전원주택 도면 검토", place: "설계팀 회의실" },
  { time: "15:00", type: "시공", title: "광주 25평 모듈러 설치 점검", place: "현장 / 광주" },
  { time: "17:00", type: "방문예약", title: "최아름 고객 옵션 상담", place: "상담실 1" },
];

/** 일정이 있는 날짜(이번달) — 캘린더 위젯 점 표시용 */
export const scheduleDays = [3, 5, 10, 12, 17, 18, 24, 27];

export type NoticeTeam = "전체" | "영업팀" | "설계팀" | "시공팀";

export interface Notice {
  id: number;
  team: NoticeTeam;
  title: string;
  date: string;
  pinned?: boolean;
}

export const notices: Notice[] = [
  { id: 1, team: "전체", title: "[중요] 2026년 상반기 인사평가 일정 안내", date: "2026-06-09", pinned: true },
  { id: 2, team: "전체", title: "여름 휴가 신청 및 대체근무 운영 공지", date: "2026-06-08" },
  { id: 3, team: "영업팀", title: "6월 모델하우스 방문 이벤트 진행 안내", date: "2026-06-08" },
  { id: 4, team: "설계팀", title: "BIM 도면 표준 템플릿 v3 배포", date: "2026-06-07" },
  { id: 5, team: "시공팀", title: "장마철 현장 안전관리 강화 지침", date: "2026-06-06" },
  { id: 6, team: "전체", title: "세움 플랫폼 통합 포털 오픈 안내", date: "2026-06-05", pinned: true },
  { id: 7, team: "영업팀", title: "신규 모듈러 25평형 가격표 업데이트", date: "2026-06-04" },
  { id: 8, team: "시공팀", title: "협력사 정기 안전교육 일정 (6/15)", date: "2026-06-03" },
  { id: 9, team: "설계팀", title: "고객 요구사항 인테이크 양식 개편", date: "2026-06-02" },
  { id: 10, team: "전체", title: "사내 메신저 '쪽지' 기능 업데이트 안내", date: "2026-06-01" },
];

export interface ContractStage {
  label: string;
  value: number;
  /** 0~100 막대 길이 비율 */
  pct: number;
}

export const contractStatus: ContractStage[] = [
  { label: "이번달 계약건수", value: 18, pct: 100 },
  { label: "계약금 수령", value: 15, pct: 83 },
  { label: "설계 진행", value: 12, pct: 67 },
  { label: "시공 진행", value: 9, pct: 50 },
  { label: "준공 완료", value: 6, pct: 33 },
];

export interface TaskItem {
  label: string;
  count: number;
  icon: IconName;
  /** 강조(긴급) 여부 */
  urgent?: boolean;
}

export const myTasks: TaskItem[] = [
  { label: "미처리 업무", count: 7, icon: "task", urgent: true },
  { label: "결재 대기", count: 3, icon: "contract" },
  { label: "계약 확인", count: 2, icon: "check" },
  { label: "설계 승인", count: 4, icon: "design" },
  { label: "시공 승인", count: 1, icon: "construction" },
];

export type AlertType = "신규 문의" | "신규 방문예약" | "신규 계약" | "설계 완료" | "시공 완료";

export interface AlertItem {
  id: string;
  type: AlertType;
  text: string;
  at: string; // HH:MM
}

export const alertIcon: Record<AlertType, IconName> = {
  "신규 문의": "inquiry",
  "신규 방문예약": "visit",
  "신규 계약": "deal",
  "설계 완료": "design",
  "시공 완료": "construction",
};

export const seedAlerts: AlertItem[] = [
  { id: "a1", type: "신규 계약", text: "이정훈 고객 본계약 체결 (25평 모듈러)", at: "11:02" },
  { id: "a2", type: "신규 방문예약", text: "최아름 고객 6/12 15:00 방문 예약", at: "10:41" },
  { id: "a3", type: "설계 완료", text: "양평 전원주택 1차 도면 설계 완료", at: "10:15" },
  { id: "a4", type: "신규 문의", text: "홈페이지 견적 문의 1건 접수", at: "09:58" },
];

/** 데모용: 새 실시간 알림 1건 생성 (Supabase 미연결 시 시뮬레이션) */
const ALERT_SAMPLES: { type: AlertType; text: string }[] = [
  { type: "신규 문의", text: "온라인카탈로그 견적 문의가 접수되었습니다" },
  { type: "신규 방문예약", text: "신규 모델하우스 방문 예약이 등록되었습니다" },
  { type: "신규 계약", text: "신규 계약이 체결되었습니다" },
  { type: "설계 완료", text: "현장 도면 설계가 완료되었습니다" },
  { type: "시공 완료", text: "시공 공정이 완료 처리되었습니다" },
];

export function makeDemoAlert(): AlertItem {
  const s = ALERT_SAMPLES[Math.floor(Math.random() * ALERT_SAMPLES.length)];
  const now = new Date();
  const at = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    type: s.type,
    text: s.text,
    at,
  };
}
