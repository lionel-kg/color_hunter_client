import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://color-hunt.lionelkg.com/api",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://color-hunt.lionelkg.com/api",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
