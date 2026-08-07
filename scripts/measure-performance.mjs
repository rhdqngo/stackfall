import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const vitePath = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const durationMs = 30_000;
const server = spawn(process.execPath, [vitePath, "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  stdio: "ignore",
});

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite exited before measurement (${server.exitCode}).`);
    try {
      const response = await fetch("http://127.0.0.1:4173/");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the performance server.");
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 1_000))]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

async function measure(browser, name, viewport, touchControls) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  if (touchControls) {
    await context.addInitScript(() => {
      localStorage.setItem("stackfall:profile:v1", JSON.stringify({
        version: 1,
        highScore: 0,
        preferences: { motion: "reduced", boardContrast: "standard", touchControls: "on" },
      }));
    });
  }
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/?fixture=running");
  const metrics = await page.evaluate(async (duration) => {
    const frameDurations = [];
    const longTasks = [];
    const memoryStart = performance.memory?.usedJSHeapSize ?? null;
    const observer = typeof PerformanceObserver === "undefined"
      ? null
      : new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((entry) => entry.duration)));
    try {
      observer?.observe({ type: "longtask", buffered: true });
    } catch {
      // Long task entries are optional in some Chromium modes.
    }

    const codes = ["ArrowLeft", "ArrowRight", "KeyX", "Space"];
    let actionIndex = 0;
    const actions = window.setInterval(() => {
      if (document.querySelector(".app-shell")?.getAttribute("data-active-screen") === "result") {
        document.querySelector("#result-retry-action")?.click();
        return;
      }
      const code = codes[actionIndex++ % codes.length];
      window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
    }, 140);

    await new Promise((resolve) => {
      const startedAt = performance.now();
      let previous = startedAt;
      const sample = (timestamp) => {
        frameDurations.push(timestamp - previous);
        previous = timestamp;
        if (timestamp - startedAt >= duration) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    window.clearInterval(actions);
    observer?.disconnect();
    frameDurations.sort((a, b) => a - b);
    const average = frameDurations.reduce((sum, value) => sum + value, 0) / frameDurations.length;
    const p95 = frameDurations[Math.floor((frameDurations.length - 1) * 0.95)] ?? 0;
    return {
      averageFrameMs: Number(average.toFixed(2)),
      p95FrameMs: Number(p95.toFixed(2)),
      maxFrameMs: Number((frameDurations.at(-1) ?? 0).toFixed(2)),
      sampledFrames: frameDurations.length,
      longTasksOver50Ms: longTasks.filter((duration) => duration >= 50).length,
      heapDeltaBytes: memoryStart === null ? null : (performance.memory?.usedJSHeapSize ?? memoryStart) - memoryStart,
      domNodes: document.getElementsByTagName("*").length,
    };
  }, durationMs);
  await context.close();
  return { name, viewport, durationMs, ...metrics };
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  results.push(await measure(browser, "desktop mixed input", { width: 1440, height: 900 }, false));
  results.push(await measure(browser, "mobile touch layout", { width: 390, height: 844 }, true));
  await browser.close();
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
  await stopServer();
} catch (error) {
  console.error(error);
  await stopServer();
  process.exit(1);
}
