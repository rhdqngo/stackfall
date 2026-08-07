# 인수인계

**마지막 갱신**: 2026-08-07

**브랜치**: master

**상태**: Stackfall Home/Game/Result Gravity Rail 시각 완성도 개선 완료, push·배포 안 함

## 완료한 목표

기존 단일 `GameShell`에 섞여 있던 시작, 플레이, 완료 역할을 `Home`, `Game`, `Result`의 세 최상위 Screen으로 분리했다. 게임 규칙과 입력 타이밍은 유지하고, 설정·조작 도움말·재시작·run 종료 확인은 현재 맥락으로 돌아오는 dialog, pause는 게임 위 overlay, 저장 복구는 toast, 작은 viewport는 blocking notice로 유지했다.

후속 시각 작업에서 dark+amber 기반을 `Gravity Rail / Lockline` 문법으로 정리했다. Home은 시작 lane, Game은 보드 왼쪽 낙하 rail, Result는 점수가 정착하는 L자 lockline을 각각 한 번만 강하게 사용한다. 반복 카드·장식 영문·기능 없는 hairline을 줄이고 모바일 정보 밀도와 예외 상태까지 같은 재료 규칙으로 맞췄다.

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
- `tokens.css`의 Carbon Field, Well Depth, Gunmetal Plate, Chalk, Slate Label, Load Amber 여섯 색을 UI와 Canvas의 의미 토큰에 매핑했다.
- Home의 좌우 hero/card 구도를 단일 시작 lane과 briefing strip으로 교체하고, Game side HUD 표면을 줄여 board를 중심에 뒀다.
- Result의 카드 배경을 없애고 세로 rail과 최종 점수 아래 수평 lockline을 연결했다. 긴 점수는 표시 길이에서 파생한 DOM 속성으로만 축소하며 게임 상태를 추가하지 않는다.
- Pause는 board 폭의 halt gate, controls는 semantic `dl`, settings는 borderless fieldset 행으로 정리했다. viewport notice 중에는 배경 Screen을 숨기고 fatal error 상세는 접힌 상태로 둔다.
- 첫 시각 비평에서 작은 Home overflow와 중복 기술 문구를 제거했고, 두 번째 비평에서 Result header hairline, viewport 배경 누출, dialog 제목 orphan을 제거했다.

## 이번 작업의 단계별 커밋

- `50eaf6f` Split Stackfall into focused Home, Game, and Result screens
- `8447a5d` Harden Screen navigation and lifecycle edge cases
- `f9647b6` Refine Stackfall with the Gravity Rail visual system
- `5af2b2c` Expand visual and responsive regression coverage
- 이 인수인계 갱신은 마지막 문서 커밋에 포함한다.

## 검증됨

- `npm run check`: 통과
  - ESLint 경고 0
  - Vitest 9개 파일, 51개 테스트 통과
  - TypeScript typecheck 통과
  - Vite production build 통과, 30 modules transformed
  - Chromium E2E 50개 통과
- Screen E2E: Home 초기 포커스, keyboard 시작/플레이/pause/resume/restart, focus-loss pause, Result 재도전/Home, active-run Back 취소·확인, direct Game/Result URL 정규화
- viewport E2E: 1440×900, 1024×768, 768×1024, 390×844, 360×640의 Home/Game/Result 경계와 가로 overflow 검증
- 모바일 E2E: touch controls는 Game에서만 표시, 이동·회전·hard drop·hold, 취소된 hard drop, 작은 viewport pause/복구 검증
- 접근성 E2E: 활성 Screen만 `inert` 해제, accessible name, dialog focus 순환·복원, reduced motion, forced colors, browser Back dialog close
- visual E2E 17개: 기존 Home/running/high-stack/hold-used/paused/Result 10개와 settings, controls, restart confirm, leave confirm, recovery toast, 320×480 viewport notice, fatal error
- 시각 수동 검토: 17개 최종 이미지를 직접 확인했고 Home은 시작 lane, Game은 board rail, Result는 L자 lockline으로 흑백에서도 역할이 구분되는 구도를 유지한다.
- 스트레스 E2E: 긴 한국어 설명, 점수·최고 점수 `9,999,999,999`, 라인 `999`, 레벨 `99`에서 mobile 가로 overflow와 결과 그룹 잘림이 없음
- 성능 각 30초:
  - desktop 1440×900: 평균 16.66ms, p95 16.8ms, 최대 16.8ms, long task 1, heap delta 0
  - mobile 390×844: 평균 16.66ms, p95 16.7ms, 최대 16.8ms, long task 1, heap delta 0
  - 이전 Screen 기준 대비 desktop p95 증가는 약 0.6%로 허용 기준 10% 이내이고, mobile/long task/heap 수치는 동일하다. DOM node는 263→253으로 감소했다.

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
