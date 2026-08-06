import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts", "./src/test/setup.tsx"],
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 10000,
  },
  oxc: {
    jsx: { runtime: "automatic", importSource: "react" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})
