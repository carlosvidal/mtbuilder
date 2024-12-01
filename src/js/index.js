// src/js/index.js
import { initializeApp } from "./app-init.js";
export * from "./components/page-manager.js";
export * from "./components/page-builder.js";
export * from "./components/builder-canvas.js";
export * from "./components/builder-sidebar.js";
export * from "./components/canvas-view-switcher.js";
export * from "./components/element-editor.js";

// Solo inicializar una vez cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
