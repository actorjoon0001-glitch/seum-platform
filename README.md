# BuildLab

건축회사 · 이동식주택 · 전원주택 · 인테리어 업체를 위한
**건축 상담 및 견적 SaaS 플랫폼**

---

## 한눈에 보기

BuildLab는 건축 관련 업체가 **고객 상담부터 견적, 3D 설계, 계약, 시공관리까지**
하나의 워크플로우로 운영할 수 있게 해주는 멀티테넌트 SaaS입니다.

| 영역 | 핵심 가치 |
|------|-----------|
| CRM | 유입된 고객을 상태(파이프라인)로 관리해 전환율을 높인다 |
| 카탈로그 | 평형별 모델/옵션을 데이터로 관리한다 |
| 실시간 견적 | 옵션 선택 즉시 가격이 반영되고 PDF로 발송한다 |
| 3D 설계 | 평면도/3D를 웹에서 보고 가구·창호·문을 배치한다 |
| 계약/시공 | 계약금·중도금·잔금, 시공 단계와 사진을 추적한다 |
| 대시보드 | 매출·계약·전환율을 실시간 지표로 본다 |

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **State**: Zustand (클라이언트 상태), TanStack Query (서버 상태)
- **3D**: React Three Fiber, Three.js
- **Backend / DB**: Supabase (Postgres + Auth + Storage + RLS + Edge Functions)
- **Deploy**: Netlify

## 설계 문서 (먼저 읽으세요)

> 본 저장소는 **설계 우선(Design-first)** 원칙을 따릅니다.
> 코드를 작성하기 전에 아래 문서를 검토/합의합니다.

| # | 문서 | 내용 |
|---|------|------|
| 00 | [docs/00-overview.md](docs/00-overview.md) | 제품 비전, 범위, 용어 |
| 01 | [docs/01-architecture.md](docs/01-architecture.md) | 시스템 아키텍처, 멀티테넌시 전략 |
| 02 | [docs/02-folder-structure.md](docs/02-folder-structure.md) | 폴더구조 / 모듈 경계 |
| 03 | [docs/03-erd.md](docs/03-erd.md) | DB 스키마, ERD, RLS, Storage |
| 04 | [docs/04-api-design.md](docs/04-api-design.md) | API / 데이터 액세스 설계 |
| 05 | [docs/05-rbac.md](docs/05-rbac.md) | 권한(RBAC) 매트릭스 |
| 06 | [docs/06-roadmap.md](docs/06-roadmap.md) | 개발 우선순위 / 마일스톤 |
| 07 | [docs/07-sso-auth.md](docs/07-sso-auth.md) | 중앙 통합 인증 / SSO (여러 시스템 단일 로그인) |

## 핵심 설계 원칙

1. **멀티테넌트 우선** — 모든 데이터는 `org_id`로 격리, RLS로 강제.
2. **확장성 우선** — 기능은 도메인 모듈로 분리, 의존성은 단방향.
3. **데이터가 진실** — 가격/옵션/권한은 코드가 아니라 DB에 둔다.
4. **AI 확장 대비** — 3D 설계는 직렬화 가능한 Scene Spec(JSON)으로 표현.
5. **유지보수 용이** — 서버 상태(TanStack Query)와 UI 상태(Zustand)를 분리.
