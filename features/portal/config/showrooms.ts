/** 전시장 코드 → 한글 라벨 */
export const SHOWROOM_LABEL: Record<string, string> = {
  headquarters: "본사 전시장",
  showroom1: "1전시장",
  showroom3: "3전시장",
  ganghwa: "강화전시장",
  andong: "안동전시장",
  gwangju: "광주전시장",
};

/** 전시장 값(코드/한글)을 한글 라벨로 표시 */
export function showroomLabel(v: string | null | undefined): string {
  if (!v) return "";
  return SHOWROOM_LABEL[v] ?? v;
}
