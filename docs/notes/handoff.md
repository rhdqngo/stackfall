# 인수인계

**마지막 갱신**: 2026-08-07
**브랜치**: master
**상태**: Stackfall 제품 UI 구현 완료, push·배포 안 함

## 완료한 목표

기존 게임 규칙과 키보드 입력 감각을 유지하면서 임시 UI를 데스크톱·태블릿·모바일에서 플레이 가능한 제품 UI로 교체했다. 승인 계획은 `docs/plans/stackfall-product-ui.md`에 있다.

## 주요 구현

- `src/app/StackfallApp.ts`가 단일 `GameState`와 UI 상태를 소유하고 `src/main.ts`는 boot만 담당한다.
- `src/ui/`에 GameShell, HUD, dialog, announcer, touch controls, feedback을 분리했다.
- `src/ui/styles/`에 토큰·기본·레이아웃·컴포넌트·모션 스타일을 분리하고 Canvas도 같은 CSS 토큰을 캐시해 사용한다.
- ready, running, paused, focus-loss paused, game-over, restart confirm, settings, controls, storage recovery, viewport notice, initialization error 상태를 구현했다.
- 최고 점수와 설정을 `stackfall:profile:v1`로 저장하며 손상·접근 실패 시 기본값으로 복구한다.
- 키보드와 터치가 같은 `InputController`/`RepeatController` 명령 계층을 사용한다. DAS 150ms와 ARR 50ms는 유지했다.
- 모바일 터치 대상은 48px 이상이며 hard drop은 버튼 내부 pointerup에서만 실행한다. pointer cancel/leave 시 반복 입력을 해제한다.
- 상태 차이에서 비차단 피드백을 파생하고 모든 모션을 220ms 이하로 제한했다. reduced motion에서는 0.01ms로 축소한다.
- Canvas와 HUD는 dirty 상태만 다시 그리고 오버레이 DOM은 상태 key가 바뀔 때만 갱신한다.
- 개발 전용 고정 fixture와 9개 시각 기준선을 추가했다. fixture/freeze 표식은 production bundle에 남지 않는다.

## 단계별 커밋

- `5ea7f68` Establish playable Stackfall MVP baseline
- `5cfbe9e` Restructure Stackfall UI around the game board
- `ea90b5d` Add resilient game state dialogs and player settings
- `fd1080e` Add responsive touch controls and stable E2E runner
- `1038296` Add non-blocking feedback and modal accessibility
- `a76c3d8` Add deterministic visual and performance validation
- 최종 문서·회귀 커밋은 이 파일을 포함한 다음 커밋이다.

## 검증됨

- `npm run lint`: 경고 0
- `npm run typecheck`: 통과
- `npm run test`: 8개 파일, 43개 테스트 통과
- `npm run build`: TypeScript와 Vite production build 통과
- `npm run test:e2e`: Chromium 통합·접근성·시각 회귀 테스트 통과
- 목표 뷰포트 1440×900, 1024×768, 768×1024, 390×844, 360×640의 가로 overflow와 보드 잘림 자동 검증
- focus-loss, restart confirm, modal focus trap, corrupted storage, minimum viewport block, reduced motion, forced colors, touch cancel 자동 검증
- production `dist`에서 `fixture`, `freeze`, `high-stack`, `hold-used` 문자열 0건 확인
- 성능 측정 각 30초: 데스크톱과 모바일 모두 평균 16.66ms, p95 16.7ms, 최대 16.8ms, 50ms 이상 long task 1건, DOM 202개
- 인앱 브라우저 360×640에서 터치 이동·회전·hard drop·hold와 scrollWidth/scrollHeight=viewport 확인

## 미검증 / 출시 전 수동 확인

- 저장된 구현 전 Performance trace가 없어 “기준선 대비 10% 이내” 상대 기준은 판정하지 않았다. `npm run measure:performance`로 이후 동일 조건 비교가 가능하다.
- iPhone Safari와 Android Chrome 실제 기기에서 safe area, 주소창 `dvh` 전환, 두 엄지 멀티터치, pointer cancel을 확인해야 한다.
- Firefox/WebKit Playwright 바이너리는 설치하지 않았고 자동 실행하지 않았다.
- 200% 브라우저 확대와 OS 고대비는 실제 데스크톱 환경에서 최종 디자인 검토가 필요하다.
- 장시간 고레벨 플레이의 DAS/ARR 체감은 규칙 회귀와 별도로 플레이테스트가 필요하다.

## 범위 준수

- `src/game/` 규칙, 점수, 7-bag, SRS, 낙하 속도, lock delay를 변경하지 않았다.
- 프레임워크, 상태 관리, 아이콘, 폰트, 이미지, 사운드 패키지를 추가하지 않았다.
- 계정, 서버, 순위표, 멀티플레이, 결제, 광고를 추가하지 않았다.
- 외부 저작권 자산을 사용하지 않았다.

## 막힌 것

- 자동 구현과 Chromium 검증은 막힌 항목이 없다. 실제 기기와 타 브라우저 수동 검증은 별도 환경이 필요하다.
