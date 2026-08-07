import "./style.css";
import { StackfallApp } from "./app/StackfallApp";
import { createAppShell, showFatalError } from "./ui/appShell";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("필수 UI 요소를 찾을 수 없습니다: #app");
}

try {
  const shell = createAppShell(root);
  new StackfallApp(shell).start();
} catch (error) {
  console.error(error);
  showFatalError(root, error);
}
