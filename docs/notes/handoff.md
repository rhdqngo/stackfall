# 인수인계

## 2026-08-25 Home 문구 제거와 인게임 확대

- 라이브 JS 번들을 직접 확인한 결과 이전 `빈틈을 읽고…`/`조각을 맞추고…` 문구는 없고 현재 대체 문구만 포함돼 있어 브라우저의 이전 HTML 캐시 문제로 판별했다.
- Home의 대체 설명도 제거해 attract well, 게임 시작, 최고 점수와 Enter 힌트만 남겼다.
- 일반 Pause의 `게임이 멈춰 있습니다` 설명을 제거하고 자동 중단·viewport 복구처럼 원인을 설명해야 할 때만 문구를 표시한다.
- desktop board cell 상한을 34px에서 50px로 늘리고 Hold/Next 폭과 preview 높이도 board cell에 맞춰 확장한다.
- README 플레이 링크에 `?release=ui-cleanup-20260825#/`를 사용해 기존 브라우저 캐시와 분리했다.
- 1920×1080 geometry 검증과 일반 Pause 설명 숨김 검증을 추가했다.
- `npm run check`: ESLint 경고 0, Vitest 51개, production build, Chromium E2E 53개 통과.
- visual fixture 17개를 갱신하고 Home/Game/Pause desktop 및 Home mobile을 직접 검토했다.

## 2026-08-25 README 최신화

- README의 Home/Game/Result 설명을 절제된 아케이드 UI 구현과 일치하도록 고쳤다.
- 최신 Playwright desktop 스냅샷 3장을 화면 자료로 배치하고 GitHub Pages workflow 상태 배지를 추가했다.
- 권장 환경을 Node.js 22와 npm 10.9.4로 명시하고 현재 검증 수치(Vitest 51, Chromium E2E 50, visual fixture 17)를 반영했다.
- 라이브 사이트, workflow, 배지는 HTTP 200이며 모든 로컬 README 링크가 존재함을 확인했다.
- `npm run check` 전체 통과. README와 이 인수인계 변경은 커밋·push하지 않았다.

## 2026-08-25 절제된 아케이드 UI 정리

Stackfall의 Drop Cabinet 정체성은 유지하면서 반복 장식, 과장된 홈 카피, 중첩 카드와 구조적 빈 공간을 정리했다.

- Home은 외곽 캐비닛과 장식 Feed Gate/상태계를 제거하고 attract well, 한 줄 설명, 시작 행동과 최고 점수만 남겼다.
- Game은 큰 외곽 캐비닛 판을 제거하고 Hold/Next를 필요한 크기로 축소했다. 실제 보드의 Feed Gate와 하단 상태 스트립만 고유 장치로 유지했다.
- Hold 상태는 보조기술에 남기고 Next 큐 번호와 `3개`, `현재 상태` 중복 레이블은 제거했다.
- Result는 중앙 카드와 잠긴 Feed Gate를 없애고 데스크톱에서 점수와 기록/행동을 나란히, 모바일에서 세로로 배치했다.
- Pause의 보이는 eyebrow와 장식 잠금 바를 제거하고 상태 설명을 짧게 다듬었다.
- Void `#0B1216`, Well `#03070A`, Cabinet `#18242A`, Raised `#26353D`, Chalk `#F0EDE3`, Load Amber `#F0A62E`로 토큰을 정리했다.
- Bahnschrift Condensed는 워드마크와 결과 점수에만, monospace는 키와 수치에만 사용한다. 패키지와 외부 자산은 추가하지 않았다.
- 시각 기준선은 변경된 Home/Game/Result/Pause 및 관련 화면에 맞춰 갱신했다.

검증:

- `npm run check`: ESLint 경고 0, Vitest 9개 파일/51개 테스트, TypeScript, production build, Chromium E2E 50개 통과
- 1440×900, 1024×768, 768×1024, 390×844, 360×640 화면 경계·overflow 검증 통과
- visual fixture 17개를 갱신하고 Home/Game/Result/Pause의 desktop/mobile 이미지를 직접 재검토했다.
- 게임 규칙, Canvas renderer, 입력 타이밍, 저장 형식과 라우팅은 변경하지 않았다.

## 2026-08-25 GitHub 공개 저장소와 Pages 배포

Stackfall을 MIT 라이선스의 공개 GitHub 저장소로 만들고 GitHub Pages에 배포했다.

- 저장소: `https://github.com/rhdqngo/stackfall`
- 기본 브랜치: `main`
- 라이브: `https://rhdqngo.github.io/stackfall/`
- Pages source: GitHub Actions workflow
- 최초 배포 run: `32851456939` (`https://github.com/rhdqngo/stackfall/actions/runs/32851456939`)
- 준비 커밋: `18102b5` Prepare Stackfall for public GitHub Pages deployment

배포 구성:

- `vite.config.ts`는 production build에 상대 base `./`를 사용하며 개발 서버는 `/`를 유지한다.
- `.github/workflows/deploy-pages.yml`은 `main` push와 수동 실행에서 Node.js 22, npm 10.9.4로 `npm ci`와 `npm run build`를 수행하고 `dist`만 Pages artifact로 배포한다.
- 별도의 원격 CI matrix는 추가하지 않았다. 로컬 `npm run check`가 push 전 검증 기준이다.
- repository description, Pages homepage와 `typescript`, `vite`, `canvas`, `game`, `playwright`, `vitest`, `accessibility` topics를 설정했다.
- `.nojekyll`, `CNAME`, `gh-pages` 브랜치와 신규 패키지는 추가하지 않았다.

검증됨:

- `npm run check`: ESLint 경고 0, Vitest 9개 파일/51개 테스트, TypeScript, production build, Chromium E2E 50개 통과
- `dist/index.html`의 JS/CSS가 `./assets/...` 상대 경로이며 HTML과 두 asset 모두 라이브에서 HTTP 200
- Pages deploy job은 32초에 성공했고 production Home이 `#/`로 정상 진입
- 라이브 Home → Game → Pause → Resume → 14회 이내 hard drop → Result 흐름 통과
- 새 탭의 `#/game` 직접 진입은 `#/` Home으로 정규화
- live console warning/error와 처리되지 않은 page error 0건
- 390×844에서 scroll width 390px, scroll height 844px, board 242×484px, touch dock 366×115.33px로 겹침과 가로 overflow 없음
- 터치 버튼은 최소 48px 이상이고 설정의 `항상 표시` 선택이 새 탭에서도 유지됨

남은 수동 검증:

- 실제 iPhone Safari/Android Chrome의 safe area, 동적 `dvh`, 두 엄지 멀티터치, pointer cancellation
- 브라우저 200% 확대와 실제 OS forced-colors/high-contrast
- 장시간 플레이의 DAS 150ms/ARR 50ms 체감
- Pages workflow는 성공했지만 GitHub가 일부 사용 action의 Node.js 20 deprecation 전환 안내를 annotation으로 표시했다. 실행은 Node.js 24로 강제되어 실패하지 않았으며 차기 action major 정리 시 재검토한다.

## 2026-08-07 Drop Cabinet / Feed Gate 전환

Stackfall의 Home, Game, Result를 한 대의 낙하 블록 아케이드 기계가 대기·플레이·결과 모드로 전환되는 `Drop Cabinet / Feed Gate` 시각 체계로 교체했다.

- Home은 큰 카피와 briefing 표 대신 CSS tetromino가 착지하는 attract well, 시작 조작, 최고 점수만 제공한다.
- Game은 기록을 보드 위 scoreboard로 이동하고 Hold/Next를 cabinet cartridge bay로 통합했다. Feed Gate는 Canvas 위를 가리지 않으며 보드 포커스는 중립색으로 분리했다.
- Result는 Gravity Rail의 L자 선을 제거하고 닫힌 Feed Gate, score window, 재도전 control deck을 사용한다.
- Pause는 카드형 modal이 아니라 cabinet을 가로막는 정지 셔터로 바꿨다.
- amber는 구조선에서 제거하고 시작, 선택, 잠금, 위험과 현재 상태에만 사용한다.
- 게임 규칙, `GameState`, History, 저장 형식, Canvas renderer, DAS 150ms와 ARR 50ms는 변경하지 않았다.

단계별 커밋:

- `8d758c4` Turn the Home screen into an arcade attract cabinet
- `6c9383a` Integrate the game board into a live arcade cabinet
- `f40f937` Finish the cabinet result and pause states

검증:

- `npm run check`: ESLint 경고 0, Vitest 9개 파일/51개 테스트, TypeScript, production build, Chromium E2E 50개 통과
- visual fixture 17개 유지 및 Home/Game/Result/Pause/Hold/high-stack/mobile 이미지를 직접 재검토
- reduced motion에서 Home attract animation name이 제거되고 정적 착지 상태가 유지됨
- 1440×900, 1024×768, 768×1024, 390×844, 360×640 geometry/overflow 검증 통과
- 성능 30초 측정: desktop/mobile 평균 16.66ms, p95 16.7ms, max 16.8ms, heap delta 0, DOM 252개
- desktop long task 0, mobile long task 1

남은 수동 검증:

- 실제 iPhone Safari/Android Chrome의 safe area, 동적 `dvh`, 멀티터치, pointer cancellation
- 실제 OS forced-colors/high-contrast와 브라우저 200% 확대
- 장시간 플레이에서 DAS/ARR 체감 확인

아래 내용은 이전 Gravity Rail 구현 시점의 기록이며 현재 시각 체계보다 오래된 정보다.

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
