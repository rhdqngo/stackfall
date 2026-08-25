import type { PauseReason } from "../app/uiState";
import type { GameStatus } from "../game/types";

export const STATUS_LABELS: Record<GameStatus, string> = {
  ready: "준비",
  running: "진행 중",
  paused: "일시정지",
  gameOver: "게임 오버",
};

export interface PauseCopy {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}

export function getPauseCopy(pauseReason: PauseReason = null): PauseCopy {
  const description = pauseReason === "interruption"
    ? "창을 벗어나 게임이 자동으로 멈췄습니다."
    : pauseReason === "viewport"
      ? "화면 크기가 복구되었습니다."
      : "";
  return {
    eyebrow: pauseReason === "interruption" ? "자동 일시정지" : "사용자 일시정지",
    title: "일시정지",
    description,
    action: "계속하기",
  };
}
