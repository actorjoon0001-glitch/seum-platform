---
name: ship
description: 세움 플랫폼 표준 배포 워크플로. 이 저장소에서 코드/설정을 변경해 main(라이브)에 반영할 때는 항상 이 절차를 따른다 — main 직접 push 금지, 새 브랜치 → main으로 PR → 빌드/타입체크 통과 시 squash 자동 머지 → Netlify 자동 배포. "반영/배포/머지/적용해줘" 같은 요청이나, 소스 변경을 라이브에 올려야 할 때 사용.
---

# ship — 세움 플랫폼 표준 배포 워크플로

이 저장소의 라이브 사이트(`seum-platform.netlify.app`)는 **Netlify가 `main` 브랜치를 자동 배포**한다.
따라서 모든 변경은 아래 절차를 **반드시** 따른다. (요약: 새 브랜치 → PR → 빌드 통과 시 자동 머지 → 자동 배포)

## 절차

1. **최신화 & 새 브랜치**
   ```bash
   git fetch origin main
   git checkout -b claude/<작업이름> origin/main
   ```
   - `main`에 **직접 push 하지 않는다.**
   - 항상 `origin/main` 기준으로 **새 브랜치**를 만든다. (squash 이력과 충돌 방지)

2. **변경 적용** — 필요한 파일 수정.

3. **빌드/타입체크 통과 확인 (게이트)**
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   - **실패하면 머지하지 말고 먼저 고친다.** (검토 없이 깨진 코드 배포 방지)

4. **커밋 → 푸시 → PR**
   ```bash
   git add -A && git commit -m "<타입>: <설명>"
   git push -u origin claude/<작업이름>
   ```
   - GitHub MCP `create_pull_request` 로 `base: main` PR 생성.

5. **자동 머지 (빌드 통과 시)**
   - GitHub MCP `merge_pull_request` 로 **squash** 머지.
   - 머지되면 Netlify가 `main`을 **자동 배포**한다.

## 원칙
- 사용자가 별도로 "머지하지 말고 PR만" 이라고 하지 않는 한, **빌드 통과 시 자동 머지**한다.
- 변경은 작게 나눠 각각 PR로 올린다 (여러 카드 연결 등은 한 PR로 묶어도 됨).
- 배포 후 사용자에게 "1~2분 뒤 새로고침(Ctrl+Shift+R)" 안내.
