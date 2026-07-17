import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    include: ["src/**/*.test.ts"],
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
