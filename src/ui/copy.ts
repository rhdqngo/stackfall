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
    ? "창을 벗어나 자동으로 멈췄습니다."
    : pauseReason === "settings" || pauseReason === "controls"
      ? "메뉴를 닫았습니다. 준비되면 계속하세요."
      : pauseReason === "restart"
        ? "현재 게임은 안전하게 멈춰 있습니다."
        : pauseReason === "navigation"
          ? "홈 이동을 취소했습니다. 준비되면 계속하세요."
          : pauseReason === "viewport"
            ? "화면 크기가 복구되었습니다. 준비되면 계속하세요."
            : "준비되면 같은 흐름으로 돌아갑니다.";
  return {
    eyebrow: pauseReason === "interruption" ? "FLOW INTERRUPTED" : "FLOW HELD",
    title: "일시정지",
    description,
    action: "계속하기",
  };
}
