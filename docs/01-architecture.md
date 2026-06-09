# 01. 시스템 아키텍처 (Architecture)

## 1. 하이레벨 구성도

```
┌──────────────────────────────────────────────────────────────┐
│                          Client (Browser)                       │
│                                                                 │
│  Next.js 15 App Router (RSC + Client Components)                │
│  ├─ UI: TailwindCSS + 공통 디자인 시스템                          │
│  ├─ 서버 상태: TanStack Query  (캐싱/동기화/낙관적 업데이트)        │
│  ├─ UI 상태:  Zustand          (모달/3D 편집/선택상태)            │
│  └─ 3D:      React Three Fiber + Three.js                       │
└───────────────┬───────────────────────────────┬───────────────┘
                │                                 │
                │ (1) 서버 렌더 / 서버 액션         │ (2) 직접 호출
                ▼                                 ▼
┌──────────────────────────────┐   ┌────────────────────────────┐
│  Next.js Server (Netlify)     │   │   Supabase                  │
│  ├─ Route Handlers (/api/*)   │   │   ├─ Postgres (+ RLS)       │
│  ├─ Server Actions            │   │   ├─ Auth (JWT)             │
│  ├─ PDF 생성 (견적/계약)        │   │   ├─ Storage (이미지/PDF)    │
│  └─ 서버 전용 비즈니스 로직      │──▶│   ├─ Edge Functions         │
│     (service_role 사용)        │   │   └─ Realtime (대시보드)     │
└──────────────────────────────┘   └────────────────────────────┘
```

### 클라이언트가 Supabase를 직접 호출하는 경로 (2)
- 읽기 위주의 단순 CRUD는 **anon key + RLS**로 클라이언트에서 직접 호출.
- 장점: 서버 왕복 제거, Realtime 구독 용이.
- 안전장치: **RLS가 1차 방어선**. 권한 없는 데이터는 DB가 차단.

### 서버를 경유하는 경로 (1)
다음은 **반드시 서버(Route Handler / Server Action)** 를 거친다.
- 가격 계산처럼 **신뢰가 필요한 연산** (클라이언트 가격 조작 방지)
- PDF 생성 (견적서/계약서)
- 멤버 초대, 권한 변경 등 **관리 작업** (service_role 필요)
- 외부 연동(이메일/PG/전자서명) 트리거

## 2. 멀티테넌시 전략

### 2.1 모델: **Shared Database, Shared Schema + RLS**

가장 운영 비용이 낮고 Supabase와 가장 자연스러운 방식을 채택한다.

- 모든 테넌트 데이터는 **한 DB / 한 스키마**에 공존.
- 모든 비즈니스 테이블은 `org_id uuid not null` 컬럼을 가진다.
- **RLS 정책**이 `org_id = 현재 사용자의 org` 조건을 강제한다.

> 대안 비교
> - DB-per-tenant: 격리 최고, 운영/마이그레이션 비용 최악 → ❌
> - Schema-per-tenant: 중간, 그러나 수백 테넌트에서 마이그레이션 부담 → ❌
> - **Row-level (RLS)**: SaaS 표준, Supabase 1급 지원 → ✅ 채택

### 2.2 테넌트 식별 흐름

```
로그인 → Supabase Auth JWT 발급
       → JWT의 app_metadata.org_id / role 주입 (Custom Claims)
       → 모든 쿼리에서 RLS가 auth.jwt() 기반으로 org 필터링
```

- 한 사용자가 여러 Org에 속할 수 있으므로(프랜차이즈/대행사),
  **활성 Org(active org)** 개념을 둔다.
- 활성 Org는 JWT custom claim 또는 `members` 조회로 결정.
  (자세한 RLS 헬퍼는 `03-erd.md` 참고)

### 2.3 격리 보증
- 1차: **RLS** (DB가 강제, 우회 불가)
- 2차: **서버 측 org 컨텍스트 검증** (service_role 사용 시 수동 체크)
- 3차: **Storage 경로 규칙** `org/{org_id}/...` + Storage RLS

## 3. 레이어드 아키텍처

```
┌─────────────────────────────────────────────┐
│  Presentation   (app/, components/)           │  ← RSC + Client UI
├─────────────────────────────────────────────┤
│  Feature Modules (features/<domain>/)         │  ← 도메인별 응집
│   hooks · components · stores · schema        │
├─────────────────────────────────────────────┤
│  Domain / Service (lib/services, lib/pricing) │  ← 순수 비즈니스 로직
├─────────────────────────────────────────────┤
│  Data Access    (lib/supabase, queries)       │  ← Supabase 클라이언트
├─────────────────────────────────────────────┤
│  Supabase (Postgres + RLS + Storage + Auth)   │
└─────────────────────────────────────────────┘
```

**의존성 규칙(단방향):** 위 → 아래로만 의존. 도메인 로직은 UI를 모른다.

## 4. 상태 관리 경계 (중요)

| 종류 | 도구 | 예시 |
|------|------|------|
| 서버 상태 | **TanStack Query** | 고객 목록, 모델, 견적, 대시보드 지표 |
| 전역 UI 상태 | **Zustand** | 활성 Org, 사이드바, 토스트 |
| 3D 에디터 상태 | **Zustand (slice)** | 배치된 가구/창/문, 선택 객체, 카메라 |
| 폼 로컬 상태 | React Hook Form | 고객 등록, 모델 편집 |

> 원칙: **서버에서 온 데이터는 Zustand에 복사하지 않는다.**
> TanStack Query 캐시가 단일 출처(SSOT)다.

## 5. 3D 설계 시스템 아키텍처 (AI 확장 대비)

핵심은 **3D 씬을 직렬화 가능한 선언적 JSON("Scene Spec")으로 표현**하는 것이다.
렌더러는 Scene Spec을 입력받아 그릴 뿐, 상태를 소유하지 않는다.

```
Scene Spec (JSON, DB 저장)
   │
   ├─▶ R3F Renderer        (화면에 3D/평면도 렌더)
   ├─▶ Editor (Zustand)    (사용자 편집 → Spec 갱신)
   └─▶ (향후) AI Designer   (요구사항 → Spec 자동 생성)
```

Scene Spec 예시(요약):
```jsonc
{
  "version": 1,
  "unit": "mm",
  "model_id": "uuid",            // 어떤 평형 모델 기반인지
  "footprint": { "w": 8000, "d": 5000 },
  "walls":   [{ "id": "w1", "a": [0,0], "b": [8000,0], "h": 2400 }],
  "openings":[{ "id":"o1","type":"window","wall":"w1","pos":2000,"w":1200 },
              { "id":"o2","type":"door","wall":"w1","pos":6000,"w":900 }],
  "furniture":[{ "id":"f1","kind":"bed","x":1000,"y":1000,"rot":0 }]
}
```

- **버전 필드**로 스키마 진화 대비.
- AI 자동설계는 동일한 Scene Spec을 출력하도록 만들면 렌더러 재사용.
- 견적 옵션(다락/데크 등)도 Scene Spec에 반영 가능 → 설계-견적 연동의 토대.

## 6. 가격 계산 신뢰 경계

```
클라이언트(견적 UI)  → 옵션 선택만 전송
서버(pricing service) → DB의 base_price + option_price로 재계산 → 신뢰 가능한 총액
```

- 클라이언트는 UX용 **미리보기 가격**만 계산.
- **확정 금액(견적서/계약서)** 은 항상 서버에서 DB 가격으로 재계산.

## 7. 비기능 요구 (NFR)

| 항목 | 목표 |
|------|------|
| 보안 | RLS 강제, service_role 키는 서버 전용, Storage 경로 격리 |
| 성능 | 목록 쿼리 인덱스, 견적 미리보기 < 100ms (클라이언트 계산) |
| 확장성 | 도메인 모듈 분리, 무상태 서버(Netlify) 수평 확장 |
| 관측성 | 구조적 로깅, Supabase 로그, 에러 트래킹(Sentry 등 확장) |
| 백업 | Supabase 자동 백업 + 마이그레이션 버전 관리 |
