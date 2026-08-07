# Stackfall Screen 아키텍처

## 결정

Stackfall의 최상위 View는 `Home`, `Game`, `Result` 세 Screen으로 고정한다. Screen 수를 늘리지 않고 플레이 전·플레이 중·플레이 완료의 역할만 분리한다.

| 표현 | 대상 | 선택 이유 |
| --- | --- | --- |
| Screen | Home, Game, Result | 앱의 주 콘텐츠와 Primary action이 교체됨 |
| Game overlay | 사용자·포커스 상실·설정·도움말·viewport에 의한 pause | 보드와 현재 run의 맥락을 유지해야 함 |
| Modal dialog | 설정, 조작 도움말, 재시작 확인, run 종료 확인 | 짧은 결정을 마친 뒤 정확한 호출 위치로 복귀해야 함 |
| Blocking notice | 보드를 안전하게 표시할 수 없는 viewport | 입력을 완전히 차단하고 기기 회전·크기 변경이 필요함 |
| Toast | 저장 데이터 복구, 복원 불가능한 URL | 사용자의 다음 행동을 막지 않는 일회성 정보 |

설정과 조작 도움말은 독립 Screen으로 만들지 않는다. 두 기능은 Home과 Pause 양쪽에서 진입하며, 별도 Screen은 불필요한 탐색 단계와 run 복귀 상태를 늘린다. Pause도 독립 Screen으로 만들지 않는다. 현재 보드 판독과 명시적인 계속하기가 핵심이기 때문이다.

## 상태 소유권

- `StackfallApp`이 `GameState`, `UiState`, `RunPresentationState`를 각각 한 번만 소유한다.
- `GameState.status`는 `ready | running | paused | gameOver` 게임 도메인 상태다.
- `UiState.screen`은 `home | game | result` 최상위 표시 상태다.
- `UiState.modal`과 `pauseReason`은 일시적인 UI 맥락이며 게임 상태를 복제하지 않는다.
- `RunPresentationState.token`은 History entry가 현재 메모리 run과 같은지 확인한다. `result`는 Game Over 시 한 번 확정한 표시용 snapshot이다.
- `PersistedProfileV1`에는 최고 점수와 환경 설정만 저장한다. 현재 보드와 run token은 저장하지 않는다.

허용되는 주요 조합은 Home+ready, Game+running/paused, Result+gameOver다. direct Game/Result URL처럼 현재 메모리 run으로 증명할 수 없는 조합은 Home으로 정규화하고 toast로 이유를 알린다.

## 내비게이션과 생명주기

`NavigationController`는 새 라우터 없이 History API와 `#/`, `#/game`, `#/result`를 사용한다.

- Home에서 시작: 새 run을 만든 뒤 Game entry를 `pushState`한다.
- 재도전: 완료된 Result entry를 새 Game entry로 `replaceState`한다.
- Game Over: 현재 Game entry를 Result entry로 `replaceState`하고 점수와 최고 점수를 먼저 확정한다.
- Result에서 Home: Result entry를 Home으로 교체한다.
- 실행 중 Back/Home: 게임을 pause하고 run 종료 확인을 연다. 취소는 `history.forward()`로 Game 위치를 회복하고 paused 상태를 보존한다.
- 설정·도움말·재시작 dialog: 같은 Screen의 modal history entry를 push한다. Back/Escape는 dialog만 닫고 호출 요소로 포커스를 복원한다.
- 새로고침·직접 URL: 진행 중 run을 복원하지 않고 Home으로 이동한다.

Screen 전환 시 Game을 벗어나면 터치 pointer/repeat를 모두 해제하고 Canvas `ResizeObserver`를 분리한다. Game으로 진입할 때만 observer와 gameplay input context를 활성화한다. `requestAnimationFrame` 자체는 앱 수명 동안 유지하지만 Game 외 화면에서는 accumulator와 렌더 작업을 수행하지 않는다.

## DOM과 포커스

`AppShell`은 세 Screen root와 전역 dialog/notice/toast를 한 번 생성한다. Screen DOM을 매번 파괴하지 않고 활성 Screen만 `hidden=false`, `inert=false`로 전환한다. Canvas와 터치 컨트롤의 수명이 안정되고 event listener 중복을 피할 수 있기 때문이다.

- Home 초기 포커스: `게임 시작`
- Game running 초기 포커스: board Canvas
- Game paused 초기 포커스: `계속하기`
- Result 초기 포커스: `다시 도전`
- Dialog 종료: 저장해 둔 opener, 없으면 현재 Screen의 Primary action
- Blocking viewport notice: notice 자체, 복구 뒤 Pause의 `계속하기`

Game 외 Screen에서는 `InputController`를 `inactive` context로 전환한다. dialog와 viewport notice에서는 `modal` context를 사용하며 모든 반복 입력과 touch pointer를 먼저 clear한다.

## 파일 경계

- `src/ui/appShell.ts`: Screen host, 전역 dialog와 notice, Screen visibility 전환
- `src/ui/screens/homeScreen.ts`: Home semantic DOM과 최고 점수 표시
- `src/ui/screens/gameScreen.ts`: Game header, Canvas/HUD, pause overlay, touch dock
- `src/ui/screens/resultScreen.ts`: 완료 결과 snapshot과 재도전/Home action
- `src/app/navigation.ts`: route/history entry 생성과 popstate 전달
- `src/app/uiState.ts`: Screen, modal, pause reason, run result 타입
- `src/app/StackfallApp.ts`: 게임 세션·내비게이션·dialog·입력 생명주기 조정
- `src/ui/dialogs.ts`: native dialog 열기/닫기와 preference 수집
- `src/ui/hud.ts`: Game Screen에만 연결되는 표시 전용 HUD

`src/game/**`는 이 구조를 알지 못한다. Screen 전환과 피드백은 게임 상태 전후 차이에서 UI 계층이 파생한다.

## 회귀 계약

- Home에는 board/HUD/touch controls가 노출되지 않는다.
- Game의 Primary visual은 항상 board이며 top action은 pause 하나다.
- Result에는 board와 touch controls가 없고 최종 결과 snapshot만 표시한다.
- active run을 떠나는 모든 경로는 명시적으로 확인받는다.
- blur/visibility loss, 설정·도움말, 작은 viewport는 자동 재개하지 않는다.
- 5개 목표 viewport에서 활성 Screen과 Game 필수 UI가 가로·세로 경계를 벗어나지 않는다.
- visual fixture는 Home, running, high-stack, hold-used, paused, Result를 고정 상태와 reduced motion으로 캡처한다.
