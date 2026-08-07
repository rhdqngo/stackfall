# Stackfall 제품 UI 업그레이드

## 목표

기존 게임 규칙과 키보드 입력 감각을 보존하면서 Stackfall의 임시 UI를 데스크톱·태블릿·모바일 웹에서 사용할 수 있는 제품 UI로 교체한다.

## 고정 결정

- 바닐라 TypeScript, semantic DOM, HTML Canvas 구조를 유지한다.
- 게임 규칙, 점수, 7-bag, SRS, 낙하 속도, lock delay, DAS 150ms, ARR 50ms는 변경하지 않는다.
- 아트 방향은 어두운 계기판 표면과 하나의 amber 낙하 축을 사용하는 `정밀 낙하 계기판 아케이드`다.
- 외부 폰트, 이미지, 아이콘 라이브러리, 사운드, 햅틱, 파티클, blur, 화면 흔들림은 사용하지 않는다.
- 한국어 단일 UI와 dark 기본 테마를 유지하고 WCAG 2.2 AA를 목표로 한다.
- 로컬 최고 점수, 접근성 설정, 모바일 터치 입력을 포함한다.

## 구현 순서

1. 기준선 커밋과 회귀 테스트
2. 디자인 토큰, GameShell, HUD, Canvas 렌더 경계
3. ready·pause·game-over·restart-confirm 상태 UI
4. 최고 점수, 설정, 저장 복구, 조작 안내
5. 데스크톱·태블릿·모바일 레이아웃과 터치 입력
6. 비차단 게임 피드백, 접근성, dirty rendering
7. E2E·시각 검증, README, handoff

## 목표 뷰포트

- 1440×900
- 1024×768
- 768×1024
- 390×844
- 360×640

모든 화면에서 의도하지 않은 가로 스크롤, 보드와 필수 HUD의 겹침·잘림이 없어야 한다. 모바일 터치 대상은 최소 48 CSS px로 유지한다.

## 완료 조건

- `npm run check`가 통과한다.
- 기존 게임 테스트를 삭제하거나 약화하지 않는다.
- ready, running, paused, game-over가 시각적·의미적으로 구분된다.
- 키보드와 터치가 같은 게임 명령 계층을 사용한다.
- modal 중 게임 입력과 진행이 차단된다.
- 모든 버튼에 accessible name과 focus 표시가 있다.
- reduced motion과 고대비 설정이 동작한다.
- 정상 흐름에서 console error와 처리되지 않은 예외가 없다.
- README와 `docs/notes/handoff.md`가 최종 구현을 반영한다.
