import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/js/index.js"),
      name: "PageBuilder",
      fileName: (format) => `page-builder.${format}.js`,
    },
  },
  server: {
    open: true,
  },
});
