# 인수인계

**마지막 갱신**: 2026-08-07

**브랜치**: master

**상태**: Stackfall Home/Game/Result Screen 개편 완료, push·배포 안 함

## 완료한 목표

기존 단일 `GameShell`에 섞여 있던 시작, 플레이, 완료 역할을 `Home`, `Game`, `Result`의 세 최상위 Screen으로 분리했다. 게임 규칙과 입력 타이밍은 유지하고, 설정·조작 도움말·재시작·run 종료 확인은 현재 맥락으로 돌아오는 dialog, pause는 게임 위 overlay, 저장 복구는 toast, 작은 viewport는 blocking notice로 유지했다.

상태와 내비게이션 결정은 `docs/plans/stackfall-screen-architecture.md`, 제품 UI의 원래 범위는 `docs/plans/stackfall-product-ui.md`에 있다.

## 주요 구현

- `src/ui/appShell.ts`가 수명이 안정적인 Screen host, 세 Screen root, 전역 dialog/notice/toast 계층을 한 번 생성한다.
- `src/ui/screens/homeScreen.ts`, `gameScreen.ts`, `resultScreen.ts`가 Screen별 semantic DOM과 Primary action을 소유한다.
- `src/app/StackfallApp.ts`가 단일 `GameState`, `UiState`, `RunPresentationState`를 조정한다. UI가 게임 상태를 중복 소유하지 않는다.
- `src/app/navigation.ts`가 History API와 `#/`, `#/game`, `#/result`를 연결하고 run token으로 메모리 세션을 검증한다.
- direct Game/Result URL과 새로고침은 저장되지 않은 run을 복원하지 않고 Home으로 정규화한다.
- 실행 중 Back/Home은 게임을 pause한 뒤 run 종료 확인을 거친다. 취소하면 paused run과 Game history 위치를 보존한다.
- 설정·도움말·재시작 dialog는 modal history entry를 사용한다. Escape/Back으로 닫고 정확한 opener로 포커스를 복원한다.
- Game 밖에서는 입력 context를 `inactive`로 전환하고 touch repeat를 reset한다. Game 진입 시에만 Canvas `ResizeObserver`를 연결한다.
- Result 진입 전에 최종 점수와 최고 점수를 확정·저장한다. 재도전은 새 Game으로 교체하고 Home 이동은 완료 run을 폐기한다.
- Home은 작은 viewport에서도 접근 가능하며 게임 시작 시에만 공간을 검사한다. 실행 중 화면 축소는 run을 자동 pause하고 크기 복구 뒤 명시적인 계속하기를 요구한다.
- 기존 amber 낙하 축과 계기판 스타일을 유지하되 Home은 진입 행동, Game은 board, Result는 최종 점수에 가장 강한 시각적 무게를 둔다.

## 이번 작업의 단계별 커밋

- `50eaf6f` Split Stackfall into focused Home, Game, and Result screens
- `8447a5d` Harden Screen navigation and lifecycle edge cases
- README, Screen 아키텍처, 이 인수인계는 마지막 문서 커밋에 포함한다.

## 검증됨

- `npm run check`: 통과
  - ESLint 경고 0
  - Vitest 9개 파일, 51개 테스트 통과
  - TypeScript typecheck 통과
  - Vite production build 통과, 30 modules transformed
  - Chromium E2E 32개 통과
- Screen E2E: Home 초기 포커스, keyboard 시작/플레이/pause/resume/restart, focus-loss pause, Result 재도전/Home, active-run Back 취소·확인, direct Game/Result URL 정규화
- viewport E2E: 1440×900, 1024×768, 768×1024, 390×844, 360×640의 Game UI 경계와 가로 overflow 검증
- 모바일 E2E: touch controls는 Game에서만 표시, 이동·회전·hard drop·hold, 취소된 hard drop, 작은 viewport pause/복구 검증
- 접근성 E2E: 활성 Screen만 `inert` 해제, accessible name, dialog focus 순환·복원, reduced motion, forced colors, browser Back dialog close
- visual E2E 10개: Home desktop/mobile, running desktop/mobile, high-stack desktop/tablet, hold-used, paused, Result desktop/mobile
- visual 수동 검토: Home은 board/HUD 없이 시작 행동 중심, Game 모바일은 board와 48px touch dock 중심, Result는 board 없이 최종 점수 중심으로 구분됨
- 성능 각 30초:
  - desktop 1440×900: 평균 16.66ms, p95 16.7ms, 최대 16.8ms, long task 1, heap delta 0
  - mobile 390×844: 평균 16.66ms, p95 16.7ms, 최대 16.8ms, long task 1, heap delta 0
  - 이전 측정과 frame/long task/heap 수치는 동일하고, persistent Screen DOM 도입으로 DOM node는 202→263 증가

## 미검증 / 출시 전 수동 확인

- iPhone Safari와 Android Chrome 실제 기기에서 safe area, 주소창 `dvh` 전환, 두 엄지 멀티터치, pointer cancel을 확인해야 한다.
- Firefox/WebKit Playwright 바이너리는 설치하지 않았고 자동 실행하지 않았다.
- 200% 브라우저 확대와 실제 OS 고대비는 데스크톱 환경에서 최종 디자인 검토가 필요하다.
- 브라우저 고유의 `beforeunload` 확인 문구와 모바일 Back gesture는 실제 브라우저에서 확인해야 한다.
- 장시간 고레벨 플레이의 DAS 150ms/ARR 50ms 체감은 별도 플레이테스트가 필요하다.

## 범위 준수

- `src/game/**` 규칙, 점수, 7-bag, SRS, 낙하 속도, lock delay를 변경하지 않았다.
- 프레임워크, 라우터, 상태 관리, 아이콘, 폰트, 이미지, 사운드 패키지를 추가하지 않았다.
- 최고 점수와 환경 설정 외의 run 상태를 저장하지 않았다.
- 계정, 서버, 순위표, 멀티플레이, 결제, 광고를 추가하지 않았다.
- 외부 저작권 자산을 사용하지 않았다.

## 막힌 것

자동 구현과 Chromium 검증에는 막힌 항목이 없다. 실제 기기·Firefox·WebKit 검증은 별도 실행 환경이 필요하다.
