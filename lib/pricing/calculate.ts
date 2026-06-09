import type { OptionKey, SceneSpec } from "@/features/designer/spec/schema";

/**
 * 견적 계산 (클라 미리보기 · 서버 확정 공용 순수 함수).
 * 상담 화면에서는 미리보기로, 서버에서는 DB 가격으로 동일 로직 재계산.
 * 금액 단위: 원(KRW).
 */

/** 평형별 기본가 (데모용; 실제로는 DB models.base_price) */
export const BASE_PRICE_BY_PYEONG: Record<number, number> = {
  10: 38_000_000,
  14: 52_000_000,
  19: 68_000_000,
  25: 89_000_000,
};

/** 옵션 단가 (데모용; 실제로는 DB options.price) */
export const OPTION_PRICE: Record<OptionKey, number> = {
  loft: 8_000_000,
  deck: 3_200_000,
  solar: 6_500_000,
  porch: 2_400_000,
};

export interface QuoteLine {
  key: "base" | OptionKey;
  label: string;
  amount: number;
}

export function calculateQuote(spec: SceneSpec): {
  lines: QuoteLine[];
  total: number;
} {
  const lines: QuoteLine[] = [
    {
      key: "base",
      label: `${spec.modelName} 기본`,
      amount: BASE_PRICE_BY_PYEONG[spec.pyeong] ?? 0,
    },
  ];

  (Object.keys(spec.options) as OptionKey[]).forEach((key) => {
    if (spec.options[key]) {
      lines.push({ key, label: optionLabel(key), amount: OPTION_PRICE[key] });
    }
  });

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total };
}

function optionLabel(key: OptionKey): string {
  const map: Record<OptionKey, string> = {
    loft: "다락",
    deck: "데크",
    solar: "태양광",
    porch: "포치",
  };
  return map[key];
}

export function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}
