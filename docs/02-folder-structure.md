# 02. 폴더 구조 (Folder Structure)

## 1. 설계 원칙

1. **Feature-first**: 도메인(고객/모델/견적…) 단위로 코드를 모은다.
2. **App Router는 얇게**: `app/`은 라우팅/레이아웃/데이터 패칭 조립만.
   실제 로직은 `features/`와 `lib/`에.
3. **공유는 의도적으로**: 진짜 공통만 `components/ui`, `lib`로 승격.
4. **경계 강제**: 도메인 모듈은 서로의 내부를 직접 import 하지 않고
   각 모듈의 `index.ts` 공개 API만 사용.

## 2. 최상위 구조

```
buildlab/
├─ app/                      # Next.js App Router (라우팅 전용)
├─ features/                 # 도메인 모듈 (핵심 코드)
├─ components/               # 공유 UI (도메인 무관)
├─ lib/                      # 인프라/유틸 (supabase, pricing, pdf...)
├─ hooks/                    # 공유 훅
├─ stores/                   # 전역 Zustand 스토어 (활성 org, ui)
├─ types/                    # 전역 타입 (DB 생성 타입 포함)
├─ config/                   # 상수/환경/권한 매트릭스
├─ supabase/                 # 마이그레이션, 시드, Edge Functions, RLS
├─ public/                   # 정적 자산 (3D 모델 glb 등)
├─ docs/                     # 설계 문서 (본 폴더)
├─ tests/                    # e2e/통합 테스트
├─ middleware.ts             # 인증/활성org 가드
├─ netlify.toml
└─ package.json
```

## 3. `app/` — 라우팅 (App Router)

라우트 그룹으로 인증/대시보드 영역을 분리한다.

```
app/
├─ (marketing)/              # 공개 랜딩/가격 페이지
│  └─ page.tsx
├─ (auth)/
│  ├─ login/page.tsx
│  └─ accept-invite/page.tsx
├─ (app)/                    # 로그인 필요 영역 (멀티테넌트)
│  ├─ layout.tsx             # 사이드바 + org 가드
│  ├─ dashboard/page.tsx
│  ├─ customers/
│  │  ├─ page.tsx            # 목록/검색
│  │  └─ [customerId]/page.tsx  # 상세/메모/상태
│  ├─ catalog/
│  │  ├─ page.tsx
│  │  └─ [modelId]/page.tsx
│  ├─ quotes/
│  │  ├─ page.tsx
│  │  └─ [quoteId]/page.tsx  # 실시간 견적 + PDF
│  ├─ designer/
│  │  └─ [sceneId]/page.tsx  # 3D 설계 (R3F)
│  ├─ contracts/
│  │  └─ [contractId]/page.tsx
│  ├─ projects/              # 시공관리
│  │  └─ [projectId]/page.tsx
│  └─ settings/
│     ├─ members/page.tsx    # RBAC: 멤버/권한
│     ├─ organization/page.tsx
│     └─ billing/page.tsx
└─ api/                      # Route Handlers (서버 전용 로직)
   ├─ quotes/[id]/pdf/route.ts
   ├─ contracts/[id]/pdf/route.ts
   ├─ members/invite/route.ts
   └─ webhooks/route.ts
```

## 4. `features/` — 도메인 모듈 (핵심)

각 도메인은 **동일한 내부 구조**를 따른다(예측 가능성).

```
features/
├─ customers/
│  ├─ components/            # CustomerTable, CustomerForm, StatusBadge...
│  ├─ hooks/                 # useCustomers, useCustomer, useUpdateStatus
│  ├─ api/                   # 쿼리/뮤테이션 (Supabase 호출)
│  ├─ schema.ts             # zod 스키마 + 타입
│  ├─ constants.ts          # 상태 enum, 유입경로 등
│  └─ index.ts              # 공개 API (배럴)
├─ catalog/                 # 모델/옵션 관리
├─ quotes/                  # 실시간 견적 + 가격 미리보기
│  ├─ components/QuoteBuilder.tsx
│  ├─ hooks/useQuoteCalc.ts # 클라 미리보기 계산
│  └─ ...
├─ designer/                # 3D 설계
│  ├─ components/
│  │  ├─ SceneCanvas.tsx     # R3F <Canvas>
│  │  ├─ FloorPlan2D.tsx     # 평면도 보기
│  │  ├─ objects/            # Wall, Window, Door, Furniture
│  │  └─ EditorToolbar.tsx
│  ├─ store/designerStore.ts # Zustand slice (Scene Spec 편집)
│  ├─ spec/                  # Scene Spec 타입/검증/마이그레이션
│  │  ├─ schema.ts
│  │  └─ migrate.ts
│  └─ index.ts
├─ contracts/               # 계약 (계약금/중도금/잔금)
├─ projects/                # 시공관리 (단계/사진/일정)
├─ dashboard/               # 지표/통계
└─ members/                 # 멤버/RBAC 관리
```

## 5. `lib/` — 인프라/도메인 서비스

```
lib/
├─ supabase/
│  ├─ client.ts             # 브라우저 클라이언트 (anon)
│  ├─ server.ts             # 서버 클라이언트 (쿠키 기반)
│  ├─ admin.ts              # service_role (서버 전용!)
│  └─ middleware.ts         # 세션 갱신
├─ pricing/
│  ├─ calculate.ts          # 견적 계산 (서버/클라 공유 순수함수)
│  └─ index.ts
├─ pdf/
│  ├─ quote-template.tsx    # 견적서 PDF
│  └─ contract-template.tsx # 계약서 PDF
├─ rbac/
│  ├─ permissions.ts        # can(role, action, resource)
│  └─ matrix.ts             # 권한 매트릭스 (config 연동)
├─ query/
│  └─ queryClient.ts        # TanStack Query 설정
└─ utils/                   # cn(), formatCurrency, date...
```

> **중요**: `pricing/calculate.ts`는 **순수 함수**로 작성해
> 클라이언트(미리보기)와 서버(확정 계산) 양쪽에서 재사용한다.

## 6. `components/` — 공유 UI

```
components/
├─ ui/                      # 버튼/인풋/모달/테이블 (shadcn 스타일)
├─ layout/                  # Sidebar, Topbar, OrgSwitcher
├─ data/                    # DataTable, Pagination, EmptyState
└─ feedback/                # Toast, Spinner, ErrorBoundary
```

## 7. `supabase/` — DB/백엔드 자산

```
supabase/
├─ migrations/              # 타임스탬프 SQL 마이그레이션
│  ├─ 0001_init_tenancy.sql       # orgs, members, profiles
│  ├─ 0002_customers.sql
│  ├─ 0003_catalog.sql
│  ├─ 0004_quotes.sql
│  ├─ 0005_designer.sql
│  ├─ 0006_contracts_projects.sql
│  └─ 0007_rls_policies.sql
├─ functions/              # Edge Functions (PDF, 알림 등)
├─ seed.sql                # 데모 데이터
└─ config.toml
```

## 8. `config/`

```
config/
├─ env.ts                  # zod로 환경변수 검증
├─ roles.ts                # 마스터/관리자/영업/설계/시공/정산
├─ permissions.ts          # 역할×리소스 권한 매트릭스 (단일 출처)
└─ statuses.ts             # 고객/시공 상태 정의 + 전이 규칙
```

## 9. 네이밍 규칙

| 대상 | 규칙 | 예 |
|------|------|----|
| 폴더/파일(코드) | kebab-case | `customer-table.tsx` |
| React 컴포넌트 | PascalCase | `CustomerTable` |
| 훅 | camelCase + `use` | `useCustomers` |
| DB 테이블/컬럼 | snake_case 복수 | `customers`, `org_id` |
| 타입/인터페이스 | PascalCase | `QuoteLine` |
| zod 스키마 | `XxxSchema` | `CustomerSchema` |

## 10. Import 경계 규칙 (lint으로 강제 권장)

- `features/a` 는 `features/b/index.ts`만 import (내부 직접 import 금지).
- `lib/`, `components/`는 `features/`를 import 하지 않는다(역의존 금지).
- `app/`은 조립만; 비즈니스 로직 직접 작성 금지.
