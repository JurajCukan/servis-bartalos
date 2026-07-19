import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    ssr: true,
    target: "node20",
    outDir: "dist-electron",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "electron/main.ts"),
        preload: path.resolve(__dirname, "electron/preload.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "esm",
      },
    },
    minify: false,
  },
});
