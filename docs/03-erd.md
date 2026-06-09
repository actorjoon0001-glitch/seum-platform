# 03. 데이터베이스 설계 / ERD

> 멀티테넌트 SaaS. **모든 비즈니스 테이블은 `org_id`를 가지며 RLS로 격리**한다.
> DB: Supabase Postgres. ID는 `uuid` (`gen_random_uuid()`), 금액은 `numeric(14,2)`,
> 시각은 `timestamptz`, 통화는 KRW 기준.

## 1. ERD (텍스트 다이어그램)

```
                         ┌────────────────┐
                         │  organizations  │  (테넌트)
                         │  id PK          │
                         └────────┬────────┘
                                  │ 1
            ┌──────────────┬──────┼───────────────┬───────────────┐
            │ N            │ N    │ N             │ N             │ N
     ┌──────▼──────┐ ┌─────▼────┐ │        ┌──────▼──────┐ ┌──────▼──────┐
     │   members   │ │customers │ │        │   models    │ │  projects   │
     │ id PK       │ │ id PK    │ │        │ id PK       │ │ id PK       │
     │ org_id FK   │ │ org_id FK│ │        │ org_id FK   │ │ org_id FK   │
     │ user_id FK  │ │ assignee │ │        └──────┬──────┘ │ customer_id │
     │ role        │ │ status   │ │               │ 1      │ contract_id │
     └──────┬──────┘ └────┬─────┘ │               │ N      │ stage       │
            │ N           │ 1     │        ┌──────▼──────┐ └──────┬──────┘
     ┌──────▼──────┐      │       │        │   options   │        │ 1
     │   profiles  │      │ N     │        │ id PK       │        │ N
     │ (auth.users)│ ┌────▼─────┐ │        │ model_id FK │ ┌──────▼────────┐
     └─────────────┘ │  notes   │ │        │ price       │ │project_updates │
                     │ customer │ │        └─────────────┘ │ photo_url      │
                     └──────────┘ │                        │ stage          │
                                  │                        └────────────────┘
                    ┌─────────────▼────────────┐
                    │          quotes           │
                    │ id PK · org_id · customer │
                    │ model_id · subtotal/total │
                    └────────────┬──────────────┘
                                 │ 1
                                 │ N
                    ┌────────────▼──────────────┐        ┌──────────────┐
                    │       quote_items          │        │   scenes     │ (3D)
                    │ quote_id FK · option_id    │        │ id PK·org_id │
                    │ label · qty · unit_price   │        │ quote_id?    │
                    └────────────────────────────┘        │ spec jsonb   │
                                 │                         └──────────────┘
                                 │ 1
                    ┌────────────▼──────────────┐
                    │         contracts          │
                    │ id PK · org_id · quote_id  │
                    │ customer_id · total_amount │
                    └────────────┬──────────────┘
                                 │ 1
                                 │ N
                    ┌────────────▼──────────────┐
                    │     contract_payments      │
                    │ kind(계약금/중도금/잔금)     │
                    │ amount · due_date · paid_at│
                    └────────────────────────────┘
```

부가: `audit_logs`(감사), `attachments`(공용 첨부) 는 모든 도메인이 참조.

## 2. 테이블 명세

### 2.1 테넌시 & 인증

#### `organizations` — 테넌트(업체)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| name | text not null | 업체명 |
| slug | text unique | URL/식별용 |
| business_type | text | building / mobile_house / country_house / interior |
| plan | text default 'free' | 요금제 (확장) |
| settings | jsonb default '{}' | 업체별 설정 |
| created_at | timestamptz default now() | |

#### `profiles` — 사용자 프로필 (auth.users 1:1)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK = auth.users.id | |
| full_name | text | |
| phone | text | |
| avatar_url | text | |
| created_at | timestamptz | |

#### `members` — Org ↔ User (N:M) + 역할
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| user_id | uuid FK → auth.users | |
| role | text not null | master/admin/sales/designer/construction/finance |
| status | text default 'active' | active/invited/disabled |
| invited_email | text | 초대 시 |
| created_at | timestamptz | |
| **UNIQUE** | (org_id, user_id) | 중복 소속 방지 |

> **역할은 `members.role`에 둔다.** JWT custom claim으로도 미러링해 RLS에서 사용.

### 2.2 CRM

#### `customers` — 고객/리드
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | 테넌트 |
| name | text not null | 이름 |
| phone | text | 연락처 |
| address | text | 주소 |
| has_land | boolean default false | 토지보유여부 |
| desired_pyeong | int | 희망평수 |
| budget | numeric(14,2) | 예산 |
| source | text | 유입경로 (online/referral/ad/visit...) |
| status | text default 'new' | 파이프라인 상태(아래 enum) |
| assignee_id | uuid FK → members | 담당 영업 |
| created_at / updated_at | timestamptz | |

`status` 값: `new, consulting, quoted, pending_contract, contracted, in_progress, done`
(신규/상담중/견적발송/계약대기/계약완료/시공중/완료)

#### `customer_notes` — 고객 메모
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| customer_id | uuid FK → customers (on delete cascade) | |
| author_id | uuid FK → auth.users | |
| body | text not null | |
| created_at | timestamptz | |

### 2.3 카탈로그

#### `models` — 건축 모델
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| name | text not null | 예: "19평 모델 A" |
| pyeong | int | 10/14/19/25, NULL=맞춤설계 |
| is_custom | boolean default false | 맞춤설계 여부 |
| description | text | |
| base_price | numeric(14,2) not null | 기본가격 |
| thumbnail_url | text | 대표 이미지(Storage) |
| spec_template | jsonb | 3D 기본 Scene Spec(평면 골격) |
| is_active | boolean default true | |
| created_at | timestamptz | |

#### `model_images` — 모델 이미지(다중)
| id PK · org_id · model_id FK · url · sort_order · created_at |

#### `options` — 모델별 옵션
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| model_id | uuid FK → models (nullable=공용옵션) | |
| name | text not null | 포치/데크/다락/태양광/창호업그레이드/황토마감 |
| category | text | 옵션 분류 |
| price | numeric(14,2) not null | 옵션가 |
| price_type | text default 'flat' | flat/per_pyeong/per_unit |
| is_active | boolean default true | |

### 2.4 견적

#### `quotes` — 견적
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| customer_id | uuid FK → customers | |
| model_id | uuid FK → models | |
| quote_no | text | 사람이 읽는 번호 (org별 시퀀스) |
| status | text default 'draft' | draft/sent/accepted/rejected |
| subtotal | numeric(14,2) | 모델+옵션 합 (서버 계산) |
| discount | numeric(14,2) default 0 | |
| total | numeric(14,2) | 최종 금액 (서버 계산) |
| valid_until | date | 유효기한 |
| pdf_url | text | 생성된 PDF (Storage) |
| created_by | uuid FK | |
| created_at / updated_at | timestamptz | |

#### `quote_items` — 견적 라인 (스냅샷)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| quote_id | uuid FK → quotes (cascade) | |
| option_id | uuid FK → options (nullable) | 어떤 옵션인지(참조) |
| label | text not null | **스냅샷** 명칭 |
| qty | int default 1 | |
| unit_price | numeric(14,2) not null | **스냅샷** 단가 |
| line_total | numeric(14,2) not null | qty*unit_price |

> **스냅샷 원칙**: 옵션 가격이 나중에 바뀌어도 과거 견적은 불변.
> 그래서 `label`/`unit_price`를 quote_items에 복사 저장한다.

### 2.5 3D 설계

#### `scenes` — 3D 설계 문서
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| customer_id | uuid FK (nullable) | |
| quote_id | uuid FK (nullable) | 견적과 연동 |
| model_id | uuid FK (nullable) | 기반 모델 |
| name | text | |
| spec | jsonb not null | **Scene Spec** (01-architecture 참고) |
| spec_version | int default 1 | 스키마 버전 |
| thumbnail_url | text | 렌더 미리보기 |
| created_by | uuid FK | |
| updated_at | timestamptz | |

> 3D 상태를 정규화하지 않고 **jsonb 한 덩어리**로 저장 → 편집/버전관리/AI 입출력 용이.

### 2.6 계약 & 시공

#### `contracts` — 계약
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| customer_id | uuid FK | |
| quote_id | uuid FK (nullable) | 어떤 견적에서 전환 |
| contract_no | text | |
| status | text default 'draft' | draft/active/signed/cancelled |
| total_amount | numeric(14,2) not null | |
| signed_at | timestamptz | 전자서명 확장 대비 |
| pdf_url | text | |
| created_by | uuid FK | |
| created_at | timestamptz | |

#### `contract_payments` — 납입 단계
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| contract_id | uuid FK (cascade) | |
| kind | text not null | down(계약금)/interim(중도금)/final(잔금) |
| sort_order | int | |
| amount | numeric(14,2) not null | |
| due_date | date | |
| paid_at | timestamptz | NULL=미납 |

#### `projects` — 시공 건
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| customer_id | uuid FK | |
| contract_id | uuid FK (nullable) | |
| stage | text default 'contract' | contract/design/permit/production/transport/install/done |
| scheduled_start | date | 시공일정 |
| scheduled_end | date | |
| manager_id | uuid FK → members | 시공담당 |
| created_at | timestamptz | |

#### `project_updates` — 시공 진행/사진
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| org_id | uuid FK | |
| project_id | uuid FK (cascade) | |
| stage | text | 당시 단계 |
| body | text | 코멘트 |
| photo_url | text | 현장 사진(Storage) |
| author_id | uuid FK | |
| created_at | timestamptz | |

### 2.7 공통

#### `audit_logs` — 감사 로그
| id · org_id · actor_id · action · entity · entity_id · meta jsonb · created_at |

#### `attachments` — 범용 첨부 (선택)
| id · org_id · entity · entity_id · url · mime · size · uploaded_by · created_at |

## 3. 인덱스 전략

```sql
-- 테넌트 필터는 거의 모든 쿼리에 들어가므로 복합 인덱스
create index on customers (org_id, status);
create index on customers (org_id, assignee_id);
create index on customers (org_id, created_at desc);
-- 이름/연락처 검색 (한글 검색: pg_trgm)
create extension if not exists pg_trgm;
create index on customers using gin (name gin_trgm_ops);

create index on models (org_id, is_active);
create index on options (org_id, model_id);
create index on quotes (org_id, customer_id);
create index on quotes (org_id, status, created_at desc);
create index on quote_items (quote_id);
create index on contracts (org_id, status);
create index on contract_payments (contract_id);
create index on projects (org_id, stage);
create index on project_updates (project_id, created_at desc);
create index on members (org_id, user_id);
```

## 4. RLS (Row Level Security) 설계

### 4.1 핵심 헬퍼 함수

```sql
-- 현재 사용자가 속한 org 목록
create or replace function auth_org_ids()
returns setof uuid language sql stable security definer as $$
  select org_id from public.members
  where user_id = auth.uid() and status = 'active'
$$;

-- 현재 사용자가 특정 org에서 가진 역할
create or replace function auth_role(p_org uuid)
returns text language sql stable security definer as $$
  select role from public.members
  where user_id = auth.uid() and org_id = p_org and status = 'active'
  limit 1
$$;
```

### 4.2 표준 정책 패턴 (모든 비즈니스 테이블)

```sql
alter table customers enable row level security;

-- 읽기: 내 org의 데이터만
create policy "read own org" on customers
  for select using (org_id in (select auth_org_ids()));

-- 쓰기: 내 org + 역할 권한 (예: 영업 이상)
create policy "write own org" on customers
  for insert with check (org_id in (select auth_org_ids()));

create policy "update own org" on customers
  for update using (org_id in (select auth_org_ids()))
  with check (org_id in (select auth_org_ids()));
```

> 세분화된 역할 권한(예: 정산만 결제 수정)은 `auth_role(org_id)`를 정책에 결합.
> 권한 매트릭스는 `05-rbac.md` 참고. 복잡한 분기는 서버(service_role)+코드 검증 병행.

### 4.3 members 테이블 (재귀 주의)
- `members`는 헬퍼 함수가 참조하므로 **무한 재귀**를 피하려고
  `security definer` 함수로 우회하거나, members 전용 단순 정책 사용:
```sql
create policy "see members of my orgs" on members
  for select using (org_id in (select auth_org_ids()));
-- 멤버 추가/역할변경은 master/admin만 → 서버(admin client)에서 처리 권장
```

## 5. Storage 설계 (버킷 & 경로)

| 버킷 | 공개 | 경로 규칙 | 용도 |
|------|------|-----------|------|
| `model-images` | public | `org/{org_id}/models/{model_id}/{file}` | 카탈로그 이미지 |
| `quote-pdfs` | private | `org/{org_id}/quotes/{quote_id}.pdf` | 견적서 |
| `contract-pdfs` | private | `org/{org_id}/contracts/{contract_id}.pdf` | 계약서 |
| `project-photos` | private | `org/{org_id}/projects/{project_id}/{file}` | 시공 사진 |
| `scene-thumbnails` | public | `org/{org_id}/scenes/{scene_id}.png` | 3D 미리보기 |

**Storage RLS**: 경로 첫 세그먼트의 `org_id`가 `auth_org_ids()`에 포함될 때만 접근.
```sql
-- 예: project-photos 읽기
create policy "org members read project photos"
on storage.objects for select using (
  bucket_id = 'project-photos'
  and (storage.foldername(name))[2]::uuid in (select auth_org_ids())
);
```
> private 버킷은 **signed URL**로 클라이언트에 노출.

## 6. 데이터 무결성 규칙

- 금액 컬럼은 `check (amount >= 0)`.
- 상태/단계는 `check (status in (...))` 또는 enum 타입.
- `quotes.total`, `subtotal`은 **트리거 또는 서버**에서만 갱신(클라 직접 X).
- 삭제는 가급적 **소프트 삭제**(`deleted_at`)를 권장(감사/복구).
- FK는 도메인 의미에 맞게 `on delete cascade`(메모/라인) vs `restrict`(계약) 구분.

## 7. 마이그레이션 순서 (`supabase/migrations`)
```
0001_init_tenancy.sql     orgs, profiles, members + 헬퍼함수
0002_customers.sql        customers, customer_notes
0003_catalog.sql          models, model_images, options
0004_quotes.sql           quotes, quote_items
0005_designer.sql         scenes
0006_contracts_projects.sql contracts, contract_payments, projects, project_updates
0007_common.sql           audit_logs, attachments
0008_rls_policies.sql     전 테이블 RLS + Storage 정책
0009_indexes.sql          인덱스
```
