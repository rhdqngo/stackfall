import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const playwrightPath = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));
const vitePath = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const server = spawn(process.execPath, [vitePath, "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
  stdio: "inherit",
});

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite exited before E2E startup (${server.exitCode}).`);
    try {
      const response = await fetch("http://127.0.0.1:4173/");
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the E2E server.");
}

async function stopServer() {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 1_000))]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

try {
  await waitForServer();
  const tests = spawn(process.execPath, [playwrightPath, "test", ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  const [code] = await once(tests, "exit");
  await stopServer();
  process.exit(typeof code === "number" ? code : 1);
} catch (error) {
  console.error(error);
  await stopServer();
  process.exit(1);
}
