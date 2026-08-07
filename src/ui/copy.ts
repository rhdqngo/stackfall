import type { PauseReason } from "../app/uiState";
import type { GameStatus } from "../game/types";

export const STATUS_LABELS: Record<GameStatus, string> = {
  ready: "준비",
  running: "진행 중",
  paused: "일시정지",
  gameOver: "게임 오버",
};

export interface OverlayCopy {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}

export function getOverlayCopy(status: GameStatus, score: number, pauseReason: PauseReason = null): OverlayCopy | null {
  if (status === "running") return null;
  if (status === "ready") {
    return {
      eyebrow: "READY / 01",
      title: "낙하 준비",
      description: "빈틈을 읽고 첫 블록을 놓으세요.",
      action: "게임 시작",
    };
  }
  if (status === "paused") {
    const description = pauseReason === "interruption"
      ? "창을 벗어나 자동으로 멈췄습니다."
      : pauseReason === "settings"
        ? "메뉴를 닫았습니다. 준비되면 계속하세요."
        : pauseReason === "restart"
          ? "현재 게임은 안전하게 멈춰 있습니다."
          : "준비되면 같은 흐름으로 돌아갑니다.";
    return {
      eyebrow: "FLOW HELD",
      title: "일시정지",
      description,
      action: "계속하기",
    };
  }
  return {
    eyebrow: "STACK CLOSED",
    title: "게임 오버",
    description: `최종 점수 ${new Intl.NumberFormat("ko-KR").format(score)}점`,
    action: "다시 시작",
  };
}
