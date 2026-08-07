# NOTICE — frontend-design

이 스킬은 직접 만든 것이 아니라 **가져온 것(vendored)** 입니다.

| 항목 | 값 |
| --- | --- |
| 출처 | https://github.com/anthropics/skills |
| 경로 | `skills/frontend-design/` |
| 커밋 | `2235be7c60b551f5de82ade908fd3816455afcda` |
| 가져온 날짜 | 2026-08-06 |
| 라이선스 | Apache License 2.0 — 전문은 `LICENSE.txt` |
| 저작권 | Anthropic, PBC |
| 수정 여부 | **없음.** `SKILL.md` 와 `LICENSE.txt` 는 위 커밋의 원본 그대로입니다. |

`NOTICE.md` 와 `agents/openai.yaml` 은 이 템플릿에서 추가한 파일이며 원본에 포함되지 않습니다.

## 왜 가져왔나

`frontend-design` 은 Claude Code 플러그인으로 배포되며, 플러그인은 **Claude Code 에서만** 동작합니다. Codex 에서 쓰려면 원본 `SKILL.md` 를 `.agents/skills/` 에 직접 두는 수밖에 없습니다. `SKILL.md` 는 [agentskills.io](https://agentskills.io) 공통 스펙이라 내용 자체는 그대로 동작합니다.

대가는 **자동 업데이트가 없다**는 점입니다. 업스트림이 바뀌어도 여기 파일은 그대로입니다.

## 업스트림 갱신 방법

현재 최신과 비교합니다.

```bash
curl -s "https://api.github.com/repos/anthropics/skills/commits?path=skills/frontend-design&per_page=1" | grep -m1 '"sha"'
```

위 표의 커밋과 다르면 이 디렉토리에서 두 파일을 다시 받고 이 문서의 커밋·날짜를 갱신합니다.

```bash
SHA=<새 커밋>
BASE="https://raw.githubusercontent.com/anthropics/skills/$SHA/skills/frontend-design"
curl -sS -o SKILL.md    "$BASE/SKILL.md"
curl -sS -o LICENSE.txt "$BASE/LICENSE.txt"
```

## 수정하지 마세요

`SKILL.md` 를 고치면 두 가지 문제가 생깁니다.

1. Apache 2.0 §4(b) 상 변경 사실을 고지할 의무가 생깁니다.
2. 업스트림 갱신 시 병합해야 합니다.

동작을 바꾸고 싶으면 원본은 그대로 두고 프로젝트의 `AGENTS.md` 에 규칙을 추가하세요. `AGENTS.md` 가 매 세션 로드되므로 스킬 내용보다 우선 반영됩니다.
