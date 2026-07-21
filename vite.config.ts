import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("tanstack")) {
              return "vendor-core";
            }
            if (
              id.includes("lucide-react") ||
              id.includes("@radix-ui") ||
              id.includes("recharts")
            ) {
              return "vendor-ui";
            }
            if (id.includes("pocketbase")) {
              return "vendor-pocketbase";
            }
          }
        },
      },
    },
  },
});
