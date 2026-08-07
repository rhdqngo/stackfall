# 인수인계

**마지막 갱신**: 2026-08-07
**브랜치**: master

## 하려던 것

빈 저장소에 Vite·TypeScript·HTML Canvas 기반 싱글플레이 낙하 블록 게임 Stackfall MVP를 구현하고 자동 테스트와 프로젝트 명령을 완성했다.

## 바뀐 것

- `src/game/`에 seed 가능한 7-bag, SRS 회전, 충돌·중력·lock delay, 행 삭제, 점수·레벨, hold·ghost·game-over 엔진과 Vitest를 추가했다.
- `src/main.ts`, `src/platform/input.ts`, `src/render/canvasRenderer.ts`, `src/style.css`에 고정 스텝 루프, DAS/ARR 키보드 입력, DPR Canvas 렌더링, 접근 가능한 반응형 HUD를 추가했다.
- `tests/e2e/game.spec.ts`에 로드·플레이·일시정지·재시작·데스크톱/좁은 화면 Playwright 검증을 추가했다.
- Vite, TypeScript, ESLint, Vitest, Playwright 설정과 npm scripts, `package-lock.json`을 추가하고 `AGENTS.md` 명령 표를 채웠다.
- `docs/plans/stackfall-mvp.md`에 MVP 범위와 제외 범위를 기록했다.

## 검증됨

- `npm run check` — 통과: ESLint 경고 0, Vitest 29개 통과, TypeScript 통과, Vite production build 통과, Chromium E2E 4개 통과
- `npm run test -- src/game/engine.test.ts` — 통과: 엔진 테스트 14개
- 인앱 브라우저 — 1280×720 및 390×844 화면, 시작·하드 드롭, 가로 넘침 없음, 콘솔 warning/error 없음 확인
- `npm install --save-dev ...` — 134개 패키지 설치, npm audit 취약점 0개

## 미검증

- 장시간 실제 플레이를 통한 레벨 후반 체감 난이도와 키보드 DAS/ARR 감각은 수동 플레이 테스트하지 않았다.
- T-spin, combo, 저장, 터치, 사운드 등은 계획대로 MVP 범위에서 제외했다.

## 다음 단계

- [ ] `npm run dev`로 직접 플레이하며 조작 감각을 확인한다.
- [ ] 결과가 만족스러우면 현재 미추적 파일을 검토한 뒤 사용자가 커밋 여부를 결정한다.

## 막힌 것 / 미해결 질문

- 없음.

## 결정

- 패키지 관리자는 npm 10.9.4와 `package-lock.json`으로 고정했다.
- UI 프레임워크나 런타임 외부 자산 없이 Canvas와 semantic DOM만 사용했다.
- 활성 블록이 시작 즉시 보이도록 스폰 기준 y를 1로 두고, 상단 2행은 숨김 행으로 유지했다.
