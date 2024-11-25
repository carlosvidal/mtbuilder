import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  //publicDir: "src/locales", // Esto hace que los archivos en src/locales sean accesibles
  build: {
    lib: {
      entry: resolve(__dirname, "src/js/index.js"),
      name: "PageBuilder",
      fileName: (format) => `page-builder.${format}.js`,
      formats: ["es"],
    },
    minify: "terser",
    terserOptions: {
      format: {
        comments: false,
        ecma: 2020,
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.warn",
        ],
        pure_getters: true,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        passes: 3,
        ecma: 2020,
        toplevel: true,
        module: true,
        booleans_as_integers: true,
        arrows: true,
        dead_code: true,
        evaluate: true,
        inline: true,
        reduce_vars: true,
        collapse_vars: true,
      },
      mangle: {
        properties: {
          regex: /^_/,
        },
        module: true,
        toplevel: true,
      },
      ecma: 2020,
      module: true,
      toplevel: true,
      sourceMap: false,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/js/index.js"),
      },
      output: {
        format: "es",
        inlineDynamicImports: false,
        manualChunks: {
          "page-builder-core": [
            "./src/js/components/builder-canvas.js",
            "./src/js/components/builder-sidebar.js",
            "./src/js/components/canvas-view-switcher.js",
            "./src/js/components/element-editor-factory.js",
            "./src/js/components/element-editor.js",
            "./src/js/components/page-builder-data-provider.js",
            "./src/js/components/page-builder-events.js",
            "./src/js/components/page-builder.js",
            "./src/js/components/page-manager.js",
            "./src/js/components/register-editors.js",
          ],
          "page-builder-editors": [
            "./src/js/components/editors/base-element-editor.js",
            "./src/js/components/editors/button-editor.js",
            "./src/js/components/editors/divider-editor.js",
            "./src/js/components/editors/heading-editor.js",
            "./src/js/components/editors/html-editor.js",
            "./src/js/components/editors/image-editor.js",
            "./src/js/components/editors/list-editor.js",
            "./src/js/components/editors/spacer-editor.js",
            "./src/js/components/editors/table-editor.js",
            "./src/js/components/editors/text-editor.js",
            "./src/js/components/editors/video-editor.js",
          ],
          "page-builder-utils": [
            "./src/js/utils/canvas-storage.js",
            "./src/js/utils/export-utils.js",
            "./src/js/utils/history.js",
          ],
        },
        chunkFileNames: "assets/[name].[hash].min.js",
        assetFileNames: "assets/[name].[hash].min.[ext]",
        entryFileNames: "[name].[hash].min.js",
        compact: true,
        generatedCode: {
          preset: "es2015",
          arrowFunctions: true,
          constBindings: true,
          objectShorthand: true,
          symbols: false,
        },
      },
    },
    copyPublicDir: true,
    target: "es2015",
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    reportCompressedSize: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.json"], // Incluir archivos JSON como assets
  server: {
    watch: {
      usePolling: true,
    },
    static: {
      directory: resolve(__dirname, "src/locales"),
      publicPath: "/locales",
    },
  },
  esbuild: {
    target: "es2015",
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
  },
});
