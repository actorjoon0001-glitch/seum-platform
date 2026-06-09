# 04. API / 데이터 액세스 설계

## 1. 접근 방식 결정 트리

```
요청이 신뢰/권한/외부연동이 필요한가?
├─ YES → 서버 경유 (Route Handler 또는 Server Action, service_role 가능)
│        예) 가격 확정, PDF 생성, 멤버 초대, 권한변경, 웹훅
└─ NO  → 클라이언트에서 Supabase 직접 호출 (anon key + RLS)
         예) 고객 목록 조회, 메모 작성, 모델 조회, 실시간 구독
```

> 원칙: **읽기/단순 CRUD는 RLS로 클라 직접**, **돈·권한·외부는 서버**.

## 2. 데이터 액세스 레이어 (TanStack Query)

각 feature는 `api/` 안에 쿼리/뮤테이션 함수와 훅을 둔다.

```ts
// features/customers/api/queries.ts
export const customerKeys = {
  all: (orgId: string) => ['customers', orgId] as const,
  list: (orgId: string, filters: CustomerFilters) =>
    [...customerKeys.all(orgId), 'list', filters] as const,
  detail: (orgId: string, id: string) =>
    [...customerKeys.all(orgId), 'detail', id] as const,
};

export function useCustomers(filters: CustomerFilters) {
  const orgId = useActiveOrg();
  return useQuery({
    queryKey: customerKeys.list(orgId, filters),
    queryFn: () => fetchCustomers(orgId, filters),
  });
}
```

- **쿼리 키에 항상 `orgId` 포함** → 테넌트 전환 시 캐시 자동 분리.
- 뮤테이션은 `onSuccess`에서 관련 키 `invalidateQueries`.
- 목록은 낙관적 업데이트(상태 변경 등)로 즉각 반응.

## 3. REST 스타일 엔드포인트 (서버 경유분)

표준 응답 포맷:
```jsonc
// 성공
{ "data": { ... } }
// 실패
{ "error": { "code": "FORBIDDEN", "message": "권한이 없습니다." } }
```

### 3.1 견적
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/quotes` | 견적 생성(서버에서 가격 확정 계산) | sales+ |
| POST | `/api/quotes/:id/recalculate` | 옵션 변경 후 서버 재계산 | sales+ |
| POST | `/api/quotes/:id/pdf` | 견적서 PDF 생성→Storage→pdf_url | sales+ |
| POST | `/api/quotes/:id/send` | 고객에게 발송 + 상태 sent | sales+ |

**견적 생성 요청 예:**
```jsonc
POST /api/quotes
{
  "customer_id": "uuid",
  "model_id": "uuid",
  "options": [{ "option_id": "uuid", "qty": 1 }],
  "discount": 0
}
// → 서버: DB의 base_price/option price로 subtotal/total 재계산 후 저장
```

### 3.2 계약
| POST | `/api/contracts` | 견적→계약 전환, 납입(계약금/중도금/잔금) 생성 | admin+ |
| POST | `/api/contracts/:id/pdf` | 계약서 PDF | admin+ |
| PATCH | `/api/contracts/:id/payments/:pid` | 납입 상태(paid_at) 갱신 | finance+ |

### 3.3 멤버/권한 (service_role)
| POST | `/api/members/invite` | 이메일 초대 | master/admin |
| PATCH | `/api/members/:id/role` | 역할 변경 | master/admin |
| DELETE | `/api/members/:id` | 비활성화 | master/admin |

### 3.4 시공
| POST | `/api/projects/:id/updates` | 진행/사진 업로드(서명URL 발급) | construction+ |
| PATCH | `/api/projects/:id/stage` | 단계 전이(전이 규칙 검증) | construction+ |

### 3.5 대시보드
| GET | `/api/dashboard/summary` | 매출/계약수/고객수/전환율 집계 | admin+ |

## 4. 가격 계산 계약 (공유 순수 함수)

```ts
// lib/pricing/calculate.ts  — 클라(미리보기)·서버(확정) 공용
export function calculateQuote(input: {
  basePrice: number;
  pyeong: number;
  options: { unitPrice: number; qty: number; priceType: 'flat'|'per_pyeong'|'per_unit' }[];
  discount?: number;
}): { subtotal: number; total: number; lines: QuoteLine[] } { ... }
```
- 클라이언트: 즉시 미리보기(UX).
- 서버: 동일 함수 + **DB에서 읽은 가격**으로 확정(신뢰).

## 5. 실시간(Realtime)
- 대시보드 지표, 시공 사진 피드는 Supabase Realtime 구독.
- 구독도 **RLS 적용** → 다른 org 변경은 수신 불가.
- TanStack Query와 결합: Realtime 이벤트 → `invalidateQueries`.

## 6. 페이지네이션 / 검색
- 목록: `range()` 기반 오프셋 또는 keyset(권장, 대량 시).
- 고객 검색: `name`/`phone`에 `ilike` + `pg_trgm` GIN 인덱스.
- 필터 파라미터: `status`, `assignee_id`, `source`, 기간.

## 7. 에러 / 검증 규약
- 입력 검증: **zod 스키마**(feature의 `schema.ts`) — 클라+서버 공유.
- 서버 에러 코드: `UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION, CONFLICT, INTERNAL`.
- RLS 거부는 빈 결과 또는 403으로 정규화.

## 8. 멱등성 / 동시성
- PDF 생성·발송 등은 멱등 키 또는 상태 가드(`status != 'sent'`)로 중복 방지.
- 견적 total 갱신은 단일 트랜잭션에서 items와 함께 처리.

## 9. 타입 안전성
- `supabase gen types typescript` → `types/database.ts` 자동 생성.
- 모든 쿼리/뮤테이션은 생성 타입을 사용해 컴파일 타임 안전성 확보.
