/**
 * Scene Spec — 3D 설계를 표현하는 직렬화 가능한 선언적 모델.
 * 렌더러/에디터/(향후)AI가 모두 이 포맷을 입출력으로 공유한다.
 * 단위: mm. (docs/01-architecture.md 참고)
 */

export type OptionKey = "loft" | "deck" | "solar" | "porch";

export interface HouseFootprint {
  /** 가로(폭), mm */
  w: number;
  /** 세로(깊이), mm */
  d: number;
  /** 벽 높이, mm */
  h: number;
}

export interface SceneSpec {
  version: 1;
  unit: "mm";
  modelName: string;
  pyeong: number;
  footprint: HouseFootprint;
  /** 활성화된 옵션 집합 */
  options: Record<OptionKey, boolean>;
}

export const OPTION_LABELS: Record<OptionKey, string> = {
  loft: "다락",
  deck: "데크",
  solar: "태양광",
  porch: "포치",
};

/** 평형별 기본 모델 템플릿 (실제로는 DB models.spec_template 에서 로드) */
export function createBaseSpec(pyeong: 10 | 14 | 19 | 25): SceneSpec {
  const dims: Record<number, HouseFootprint> = {
    10: { w: 5400, d: 6000, h: 2600 },
    14: { w: 6600, d: 7000, h: 2700 },
    19: { w: 7800, d: 8000, h: 2800 },
    25: { w: 9000, d: 9000, h: 2900 },
  };
  return {
    version: 1,
    unit: "mm",
    modelName: `${pyeong}평 모델`,
    pyeong,
    footprint: dims[pyeong],
    options: { loft: false, deck: false, solar: false, porch: false },
  };
}
