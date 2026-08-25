import { defineConfig } from "vitest/config";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  test: {
    include: ["src/**/*.test.ts"],
  },
}));
