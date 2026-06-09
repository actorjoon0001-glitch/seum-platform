# 05. 권한 설계 (RBAC)

## 1. 역할 정의

| 역할 | 코드 | 설명 |
|------|------|------|
| 마스터 | `master` | 오너. 모든 권한 + 조직/결제/멤버 관리 |
| 관리자 | `admin` | 운영 전반 관리(결제 제외 가능) |
| 영업 | `sales` | 고객/견적 중심 |
| 설계 | `designer` | 모델/3D 설계 중심 |
| 시공 | `construction` | 시공/사진/일정 중심 |
| 정산 | `finance` | 계약 납입/매출 정산 중심 |

> 역할은 `members.role`에 저장(테넌트별로 다른 역할 가능).
> 단일 출처: `config/roles.ts` + `config/permissions.ts`.

## 2. 권한 매트릭스 (리소스 × 액션)

범례: ✅ 전체 · 🟡 제한(본인담당/읽기) · ❌ 없음

| 리소스 \ 역할 | master | admin | sales | designer | construction | finance |
|---------------|:------:|:-----:|:-----:|:--------:|:------------:|:-------:|
| 조직설정/요금제 | ✅ | 🟡읽기 | ❌ | ❌ | ❌ | ❌ |
| 멤버/권한 관리 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 고객(CRM) | ✅ | ✅ | ✅ | 🟡읽기 | 🟡읽기 | 🟡읽기 |
| 고객 상태변경 | ✅ | ✅ | ✅ | ❌ | 🟡시공중→완료 | ❌ |
| 모델/옵션 카탈로그 | ✅ | ✅ | 🟡읽기 | ✅ | 🟡읽기 | 🟡읽기 |
| 견적 | ✅ | ✅ | ✅ | 🟡읽기 | ❌ | 🟡읽기 |
| 3D 설계(scenes) | ✅ | ✅ | 🟡읽기 | ✅ | 🟡읽기 | ❌ |
| 계약(contracts) | ✅ | ✅ | 🟡생성/읽기 | ❌ | 🟡읽기 | ✅ |
| 납입(payments) | ✅ | ✅ | 🟡읽기 | ❌ | ❌ | ✅ |
| 시공(projects) | ✅ | ✅ | 🟡읽기 | 🟡읽기 | ✅ | 🟡읽기 |
| 시공 사진/단계 | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 대시보드 매출 | ✅ | ✅ | 🟡본인실적 | ❌ | ❌ | ✅ |

> 위 매트릭스는 합의용 기준선. 업체별 커스텀이 필요하면
> `members`에 `permissions jsonb` 오버라이드 컬럼으로 확장 가능(향후).

## 3. 구현 계층 (3중 방어)

```
1) DB RLS        : org 격리 + 핵심 쓰기 권한 (우회 불가, 최후 방어선)
2) 서버 가드      : Route Handler/Server Action에서 can() 검사 후 service_role
3) UI 가드        : 버튼/메뉴 숨김 (UX, 보안 아님)
```

### 권한 체크 함수 (단일 출처)
```ts
// lib/rbac/permissions.ts
type Action = 'view'|'create'|'update'|'delete'|'manage';
type Resource = 'customer'|'quote'|'contract'|'payment'
              | 'project'|'model'|'scene'|'member'|'org'|'dashboard';

export function can(role: Role, action: Action, resource: Resource): boolean {
  return PERMISSION_MATRIX[role]?.[resource]?.includes(action) ?? false;
}
```

```ts
// 서버 가드 사용 예
const role = await getActiveRole(orgId, userId);
if (!can(role, 'update', 'payment'))
  return forbidden();   // { error: { code: 'FORBIDDEN' } }
```

```tsx
// UI 가드 사용 예
{can(role, 'create', 'contract') && <Button>계약 생성</Button>}
```

## 4. RLS와 매트릭스의 역할 분담

| 검사 | 어디서 | 이유 |
|------|--------|------|
| "내 org 데이터만" | **RLS** | 절대 우회 불가해야 함 |
| "정산만 납입 수정" | RLS(`auth_role`) + 서버 | 민감 → 이중 |
| "영업은 견적 생성" | 서버 가드 우선, RLS 보조 | 비즈니스 규칙 |
| "버튼 노출" | UI | 편의 |

## 5. 멤버 초대 & 역할 부여 흐름
```
master/admin → /api/members/invite (이메일, 역할)
  → invited 상태 members 행 생성 + 초대 메일
  → 수락(accept-invite) → auth.users 연결 → status=active
  → JWT custom claim(org_id, role) 갱신
```

## 6. 보안 주의사항
- `service_role` 키는 **서버에서만**. 클라 번들 유입 금지(`lib/supabase/admin.ts`).
- 역할 변경/멤버 관리는 항상 서버 경유(RLS만으로 충분치 않음).
- 모든 권한 거부는 감사 로그(`audit_logs`)에 기록 권장.
