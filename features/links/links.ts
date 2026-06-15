/**
 * 외부 시스템 바로가기 링크 데이터 (단일 출처).
 *
 * 새 링크 추가는 아래 배열에 항목 하나만 넣으면 됩니다.
 *   { id, title, url, description?, category? }
 * 메인 화면(app/page.tsx)의 <LinkHub /> 가 이 배열을 카드로 렌더합니다.
 */
export type AppLink = {
  /** 고유 식별자 (영문 슬러그 권장) */
  id: string;
  /** 카드에 보일 이름 */
  title: string;
  /** 바로가기 대상 URL */
  url: string;
  /** 짧은 설명 (선택) */
  description?: string;
  /** 분류 라벨 (선택, 예: "설계", "회계", "협업") */
  category?: string;
};

export const appLinks: AppLink[] = [
  // 여기에 링크를 하나씩 추가합니다. 예:
  // {
  //   id: "supabase",
  //   title: "Supabase 대시보드",
  //   url: "https://supabase.com/dashboard/project/etxiqooicuhrcusxgyfv",
  //   description: "DB · 인증 · 스토리지 관리",
  //   category: "인프라",
  // },
];
