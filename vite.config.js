import { defineConfig } from "vite";

export default defineConfig(async () => {
  const glsl = await import("vite-plugin-glsl");

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "Game",
        fileName: "game.ts",
      },
    },
    rollupOptions: {
      external: [/^node:\w+/],
    },
    plugins: [glsl.default()],
    server: {
      host: true,
      port: 8080,
    },
  };
});
