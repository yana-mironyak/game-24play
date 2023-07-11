import { defineConfig } from "vite";

export default defineConfig(async () => {
  const glsl = await import("vite-plugin-glsl");

  return {
    plugins: [glsl.default()],
    server: {
      host: true,
      port: 8080,
    },
  };
});
