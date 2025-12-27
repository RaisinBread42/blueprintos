import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Next.js uses this to prevent importing server-only modules in the client.
      // In unit tests we run in a plain Node environment, so we alias it to a no-op.
      "server-only": path.resolve(__dirname, "./src/test/noopServerOnly.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});


