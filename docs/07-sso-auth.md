# 07. 중앙 통합 인증 / SSO (Central Auth & SSO)

> 여러 시스템(세움OS · Call OS · 계약서OS · 설계OS · 시공OS · 정산OS …)을
> **각각 따로 개발·배포**하되, **로그인만 중앙 하나로 통합**한다.
> 한 번 로그인하면 모든 시스템에 자동 로그인(SSO)된다.

---

## 1. 목표와 제약

| 구분 | 내용 |
|------|------|
| 개발 | 각 시스템은 **독립 레포/배포** 가능 (혼자 개발, 시스템별 점진 추가) |
| 데이터 | 시스템별 데이터 서버 **분리 가능** (Supabase 프로젝트 분리 허용) |
| 인증 | **계정·로그인·세션은 중앙 1곳** (단일 신원 출처) |
| SSO | 한 번 로그인 → 모든 시스템 자동 통과 |
| SLO | 한 번 로그아웃 → 전체 로그아웃 (지향) |
| 비용 | 중앙 인증 프로젝트는 데이터가 작아 **무료/저티어 유지** |

### 핵심 원칙

> **"데이터는 분리해도 된다. 신원(identity)은 하나여야 한다."**

- **인증(Authentication, 누구인가)** → **중앙**에서만 처리.
- **인가(Authorization, 무엇을 할 수 있나 = RBAC)** → 각 시스템이 판단하되,
  중앙이 발급한 **공유 클레임(org_id, role)** 을 신뢰한다. (`05-rbac.md` 그대로 재사용)

이유: 기능/UI/데이터는 나중에 API로 연동할 수 있지만, **로그인은 나중에 합치면
계정 마이그레이션 지옥**이 된다. 그래서 인증만은 1일차부터 중앙으로 고정한다.

---

## 2. 토폴로지

```
                  ┌────────────────────────────────────────┐
                  │   중앙 인증 (Identity Provider)           │
                  │   = Supabase 프로젝트 1개  +  로그인 포털   │
                  │   auth.users · 세션 · SSO 핸드오프          │
                  │   배포: auth.example.com (또는 BuildFlow)  │
                  └───────────────┬────────────────────────┘
                                  │  ① 로그인 위임 (redirect)
                                  │  ② 세션 토큰 핸드오프
        ┌──────────────┬──────────┴───────┬──────────────┐
        ▼              ▼                   ▼              ▼
   ┌─────────┐    ┌─────────┐         ┌─────────┐    ┌─────────┐
   │ 세움OS   │    │ Call OS │   …     │ 계약서OS │    │  포털     │
   │ (위성)   │    │ (위성)   │         │ (위성)   │    │ BuildFlow│
   └────┬────┘    └────┬────┘         └────┬────┘    └────┬────┘
        │ (자기 도메인 데이터는 자기 Supabase, 선택)            │
        ▼              ▼                   ▼              ▼
   [data DB]      [data DB]           [data DB]      [data DB]
   user_id 로 중앙 신원과 연결 (FK 아님, 논리적 키)
```

- **중앙 인증**: 계정과 세션의 단일 출처. 이 프로젝트의 `auth.users.id`(UUID)가
  **모든 시스템 공통 사용자 식별자**다.
- **위성 시스템**: 자기 도메인 데이터는 자기 Supabase(또는 공유 DB)에 두되,
  사용자 행은 항상 중앙 `user_id`로 참조한다.
- **포털(BuildFlow)**: "자주 사용하는 시스템" 버튼 화면. 버튼은 단순 링크 +
  SSO 리다이렉트로 동작.

> 비용 메모: 중앙 인증 프로젝트는 auth 데이터만 담아 매우 가볍다 →
> 무료/저티어에 머문다. 데이터가 큰 시스템만 필요할 때 별도 Supabase로 분리한다.

---

## 3. 인증 방식 결정

도메인이 서로 다르면(`seum-os.netlify.app` 등) **localStorage/쿠키는 공유되지
않으므로**, 표준 SSO는 **리다이렉트 핸드오프**로 구현한다. 두 가지 길:

| 방식 | 설명 | 비용 | 추천 |
|------|------|------|------|
| **A. 단일 Supabase Auth + 리다이렉트 토큰 릴레이** | 중앙 Supabase 1개를 모든 시스템이 공유. 중앙 로그인 후 세션 토큰을 위성으로 안전 전달 | 무료 | ✅ **채택** (현 스택 유지, 추가 비용 0) |
| B. 외부 IdP(Clerk/Auth0/WorkOS) + Supabase Third-Party Auth | IdP가 OIDC로 SSO 제공, 각 Supabase가 IdP JWT 신뢰 | 무료~유료 | 🔄 규모 커지면 전환 고려 |

> 결론: **방식 A로 시작**한다. 표준 OIDC가 필요할 만큼 외부 연동/시스템이
> 많아지면 방식 B로 이전(인증 경계가 명확하면 이전 비용이 작다).

---

## 4. SSO 로그인 흐름 (방식 A · 도메인 달라도 동작)

```
사용자 ─▶ 세움OS 접속
            │  세션 없음
            ▼
세움OS ─▶ 중앙으로 리다이렉트:  https://auth.example.com/sso/authorize
            ?client=seum-os
            &redirect_uri=https://seum-os.../auth/callback
            &state=<csrf-random>
            │
            ▼
중앙 인증
   ├─ 중앙에 로그인 세션 있음?
   │     ├─ 없음 → 로그인 화면 → 로그인 성공
   │     └─ 있음 → (자동 통과, 화면 안 보임) ◀── 이게 SSO 핵심
   │
   ├─ redirect_uri 가 허용 목록(client 등록)에 있는지 검증
   ├─ 일회용 인가 코드(code) 발급 (수명 ~60초, 1회용)
   └─ 리다이렉트: redirect_uri?code=<one-time>&state=<csrf>
            │
            ▼
세움OS /auth/callback
   ├─ state(CSRF) 검증
   ├─ 서버에서 중앙 /sso/token 에 code 교환 요청
   │     → { access_token, refresh_token } 수신
   ├─ supabase.auth.setSession({ access_token, refresh_token })
   └─ 세움OS 세션 쿠키 설정 → 원래 페이지로 이동  ✅ 로그인 완료
```

- 두 번째 시스템(Call OS)에 가면 **중앙에 이미 세션이 있으므로 로그인 화면 없이
  통과** → 사용자 입장에서 "한 번 로그인하면 다 됨".
- 일회용 `code`만 URL에 노출되고, 실제 토큰은 **서버↔서버**로만 교환 →
  토큰이 브라우저 주소/히스토리에 남지 않는다.

### 중앙이 제공해야 할 엔드포인트

| 엔드포인트 | 역할 |
|-----------|------|
| `GET /sso/authorize` | 로그인 확인 → 일회용 code 발급 후 redirect_uri로 반환 |
| `POST /sso/token` | code ↔ { access_token, refresh_token } 교환 (서버 전용) |
| `GET /sso/logout` | 중앙 세션 종료 + 등록된 위성에 로그아웃 전파(아래 §7) |
| `GET /sso/userinfo` | (선택) 토큰으로 프로필/클레임 조회 |

> 구현은 Supabase Auth 위에 얇은 OAuth 핸드오프를 얹는 것. 표준 OIDC를 100%
> 따를 필요는 없고, 위 4개로 충분하다. (향후 방식 B 전환 시 OIDC로 승격)

---

## 5. 토큰 / 클레임 설계

중앙 발급 JWT(access token)에 **공유 클레임**을 심어 모든 시스템이 동일 기준으로
인가를 판단한다. (`01-architecture.md` §2.2의 custom claims를 그대로 확장)

```jsonc
// access token payload (요약)
{
  "sub": "uuid",                 // 사용자 id = 모든 시스템 공통 키
  "email": "user@company.com",
  "app_metadata": {
    "org_id": "uuid",            // 활성 조직 (멀티테넌시 키)
    "role": "sales",             // RBAC 역할 (05-rbac.md)
    "systems": ["seum","call"]   // 접근 허용 시스템 (포털 버튼 노출/접근 제어)
  },
  "exp": 0
}
```

- `org_id`, `role` → 각 위성의 **RLS + 서버 가드**가 그대로 사용.
- `systems` → 포털에서 **버튼 노출**, 위성에서 **진입 차단**에 사용.
- 클레임 주입은 중앙 Supabase의 **Auth Hook(Custom Access Token Hook)** 으로
  로그인 시 자동 삽입.

---

## 6. 각 시스템(위성)의 통합 계약 (Integration Contract)

새 시스템을 만들 때 **반드시 지킬 규칙**. 이것만 지키면 SSO에 자동 편입된다.

1. **중앙 Supabase 프로젝트의 `project_ref`·anon key를 인증용으로 공유 사용**
   (자기 데이터용 Supabase는 별개로 둬도 됨 → "신원=중앙, 데이터=분리").
2. **세션 없으면 중앙 `/sso/authorize`로 리다이렉트** (자체 회원가입/로그인 폼 금지).
3. **`/auth/callback`** 라우트에서 code 교환 → `setSession` → 쿠키 설정.
4. **`middleware.ts` 가드**로 보호 경로 진입 시 세션 검사 → 없으면 §4 흐름 시작.
5. **권한**은 토큰의 `role`/`org_id`로 `can()` 검사 (`05-rbac.md`의 `lib/rbac`).
6. **로그아웃**은 항상 중앙 `/sso/logout` 경유 (자체 단독 로그아웃 금지).

> 권장: 위 1~6을 **공유 패키지**(`packages/auth` 또는 npm 사내 패키지
> `@buildflow/auth`)로 캡슐화해 시스템마다 복붙하지 않는다. 미들웨어·콜백·
> `getSession()`·`signOut()`을 한 곳에서 export.

### 위성 환경변수 (공통)

```bash
# 모든 시스템 공통: 인증은 중앙을 가리킨다
NEXT_PUBLIC_AUTH_BASE_URL="https://auth.example.com"
NEXT_PUBLIC_SUPABASE_URL="https://<중앙-ref>.supabase.co"   # 인증용(중앙)
NEXT_PUBLIC_SUPABASE_ANON_KEY="<중앙 anon key>"
SSO_CLIENT_ID="seum-os"           # 시스템 식별자(중앙에 등록)
SSO_CLIENT_SECRET="..."           # /sso/token 서버 교환용 (서버 전용)

# (선택) 자기 도메인 데이터는 별도 Supabase
DATA_SUPABASE_URL="https://<seum-data-ref>.supabase.co"
DATA_SUPABASE_ANON_KEY="..."
```

---

## 7. 로그아웃 (SLO, Single Logout)

- `/sso/logout` 호출 → 중앙 세션 폐기 → 등록된 위성들의 `back-channel logout`
  URL로 알림(또는 위성 진입 시 토큰 무효 감지로 정리).
- 최소 구현: 중앙 세션만 폐기 + access token 수명을 짧게(예: 1h) 두고
  refresh를 중앙에 의존시키면, 다음 토큰 갱신 때 자연 로그아웃된다.

---

## 8. 데이터 분리와의 관계

각 시스템이 **자기 Supabase 데이터 프로젝트**를 따로 쓰는 경우:

- 그 DB의 사용자 관련 행은 **중앙 `user_id`(UUID)를 그대로 키로 저장**
  (서로 다른 프로젝트라 DB FK는 불가 → **논리적 키**로 관리).
- RLS는 토큰의 `sub`/`org_id`를 기준으로 `auth.uid()` 대신 **JWT 클레임 검증**
  방식으로 작성(데이터 프로젝트가 토큰을 신뢰하도록 JWT secret/JWKS 공유 설정).
- 비용 신경 쓰이면 **초기엔 데이터도 중앙 한 프로젝트에 같이** 두고, 특정
  시스템이 커질 때 그 시스템 데이터만 새 프로젝트로 이전(인증은 안 건드림).

---

## 9. 단계별 도입 (Rollout)

```
P0. 중앙 인증 프로젝트 확정 + 로그인 포털(BuildFlow)
    - Supabase Auth(이메일 로그인) + Custom Access Token Hook(org_id/role/systems)
    - 포털 "자주 사용하는 시스템" 버튼 화면 (단순 링크부터)
P1. 중앙 SSO 엔드포인트 (/sso/authorize · /sso/token · /sso/logout)
    + client(시스템) 등록 테이블, redirect_uri 허용목록
P2. 공유 auth 패키지(@buildflow/auth): middleware · callback · session · signOut
P3. 첫 위성(세움OS)을 패키지로 편입 → 포털 버튼에서 SSO 진입 검증
P4. 나머지 시스템(Call/계약서/설계/시공/정산) 순차 편입
P5. SLO(단일 로그아웃) + systems 클레임 기반 접근 제어 완성
```

**P0 DoD:** 포털에서 로그인 1회 → 버튼 클릭 → 세움OS가 **추가 로그인 없이** 열림.

---

## 10. 보안 주의사항

- `redirect_uri`는 **반드시 서버측 허용목록(client 등록)으로 화이트리스트**.
  (오픈 리다이렉트 → 토큰 탈취 방지)
- 인가 `code`는 **1회용·단명(≤60s)·서버교환 전용**. URL에 토큰 직접 노출 금지.
- `state` 파라미터로 **CSRF 방어**, `SSO_CLIENT_SECRET`은 **서버 전용**.
- `service_role` 키는 §`05-rbac.md`대로 **절대 클라이언트 번들 유입 금지**.
- 데이터 프로젝트 분리 시 **JWT 신뢰 설정(secret/JWKS) 일치** 필수 — 불일치하면
  위성 RLS가 토큰을 거부한다.

---

## 11. 미해결 / 결정 필요 (Open Questions)

- [ ] 중앙 인증 도메인: 전용 `auth.example.com` vs 포털(BuildFlow)에 겸용?
- [ ] 커스텀 도메인 확보 여부(없으면 netlify.app 도메인별 분리 → 리다이렉트 방식 필수).
- [ ] 데이터: 시스템별 분리 시점 기준(테이블 수/용량/트래픽 임계치).
- [ ] 방식 B(외부 IdP) 전환 트리거(시스템 수, 외부 파트너 로그인 요구 등).
- [ ] `systems` 클레임 관리 UI(어느 사용자가 어떤 시스템 접근 가능한지).
