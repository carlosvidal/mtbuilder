import { BuilderIcon } from "./builder-icon.js";
import { History } from "../utils/history.js";
import { ExportUtils } from "../utils/export-utils.js";
import { I18n } from "../utils/i18n.js";

class CanvasViewSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentView = "design";
    this.editorData = null;
    this.canvas = null;
    this.history = new History();
    this._isUndoRedoOperation = false;
    this.i18n = I18n.getInstance();
    window.builderEvents = window.builderEvents || new EventTarget();

    // Bind the event handlers
    this.handleHistoryChange = this.handleHistoryChange.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleRedo = this.handleRedo.bind(this);
    this.contentChangedListener = this.contentChangedListener.bind(this);
  }

  static get observedAttributes() {
    return ["pageId"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue !== oldValue) {
      console.log("Canvas: pageId attribute changed to", newValue);
      const switcher = this.shadowRoot.querySelector("canvas-view-switcher");
      if (switcher) {
        console.log("Canvas: Setting pageId on switcher:", newValue);
        switcher.setAttribute("pageId", newValue);
      }
    }
  }

  connectCanvas() {
    this.canvas = this.shadowRoot.querySelector("builder-canvas");
    if (this.canvas) {
      this.canvas.addEventListener(
        "contentChanged",
        this.contentChangedListener
      );
    }
  }

  connectedCallback() {
    this.setupInitialDOM();
    this.connectCanvas(); // Agregar esta línea
    this.setupEventListeners();
    this.updateActiveView();

    window.builderEvents.addEventListener(
      "historyChange",
      this.handleHistoryChange
    );
  }

  disconnectedCallback() {
    if (this.canvas) {
      this.canvas.removeEventListener(
        "contentChanged",
        this.contentChangedListener
      );
    }
    window.builderEvents.removeEventListener(
      "historyChange",
      this.handleHistoryChange
    );
  }

  // En canvas-view-switcher.js
  handleHistoryChange(event) {
    const { canUndo, canRedo } = event.detail;
    console.log("History change:", { canUndo, canRedo });

    const undoButton = this.shadowRoot.querySelector(".undo-button");
    const redoButton = this.shadowRoot.querySelector(".redo-button");

    if (undoButton) {
      undoButton.disabled = !canUndo;
      undoButton.classList.toggle("active", canUndo);
    }

    if (redoButton) {
      redoButton.disabled = !canRedo;
      redoButton.classList.toggle("active", canRedo);
    }
  }

  handleUndo() {
    console.log("Undo requested");
    const canvas = this.shadowRoot.querySelector("builder-canvas");
    if (canvas) {
      canvas.handleUndo();
    }
  }

  handleRedo() {
    console.log("Redo requested");
    const canvas = this.shadowRoot.querySelector("builder-canvas");
    if (canvas) {
      canvas.handleRedo();
    }
  }

  setupInitialDOM() {
    const pageId = this.getAttribute("pageId");
    console.log("CanvasViewSwitcher: Setting up DOM with pageId:", pageId);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          background: #fff;
        }

        * {
          box-sizing: border-box;
        }

        .view-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        .view-tabs {
          display: flex;
          flex: 1;
        }

        .view-tab {
          padding: 1rem 2rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
          font-size: 0.875rem;
          position: relative;
        }

        .view-tab:hover {
          color: #2196F3;
        }

        .view-tab.active {
          color: #2196F3;
          font-weight: 500;
        }

        .view-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #2196F3;
        }

        .view-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0 1rem;
        }

        .view-actions button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: none;
          background: none;
          color: #666;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .view-actions button:hover:not(:disabled) {
          background: rgba(33, 150, 243, 0.1);
          color: #1976D2;
        }

        .view-actions button.active {
          color: #2196F3;
        }

        .view-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .view-actions .copy-button,
        .view-actions .download-button {
          background: #2196F3;
          color: white;
          padding: 0.5rem 1rem;
        }

        .view-actions .copy-button:hover,
        .view-actions .download-button:hover {
          background: #1976D2;
          color: white;
        }

        .view-content {
          flex: 1;
          overflow: auto;
          position: relative;
        }

        .view {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
        }

        .view.active {
          display: block;
        }

        .design-view {
          height: 100%;
        }

        .preview-view {
          height: 100%;
          padding: 2rem;
          background: #f8f9fa;
        }

        .preview-frame {
          width: 100%;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .preview-frame.mobile {
          max-width: 480px;
        }

        .preview-frame.tablet {
          max-width: 768px;
        }

        .preview-frame.desktop {
          max-width: 1200px;
        }

        .code-view {
          padding: 1rem;
          background: #f8f9fa;
          height: 100%;
        }

        .code-view pre {
          margin: 0;
          padding: 1rem;
          background: white;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.5;
          overflow: auto;
        }

        .notification {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          padding: 0.75rem 1rem;
          background: #4CAF50;
          color: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>

      <div class="view-container">
        <div class="view-header">
          <div class="view-tabs">
            <button class="view-tab ${
              this.currentView === "design" ? "active" : ""
            }" data-view="design">
              ${this.i18n.t("builder.canvas.views.design")}
            </button>
            <button class="view-tab ${
              this.currentView === "preview" ? "active" : ""
            }" data-view="preview">
              ${this.i18n.t("builder.canvas.views.preview")}
            </button>
            <button class="view-tab ${
              this.currentView === "html" ? "active" : ""
            }" data-view="html">
              ${this.i18n.t("builder.canvas.views.html")}
            </button>
            <button class="view-tab ${
              this.currentView === "json" ? "active" : ""
            }" data-view="json">
              ${this.i18n.t("builder.canvas.views.json")}
            </button>
          </div>
          <div class="view-actions">
            ${
              this.currentView === "design"
                ? `
              <button class="undo-button" disabled>
                <builder-icon name="undo" size="20"></builder-icon>
                <span>${this.i18n.t("builder.canvas.actions.undo")}</span>
              </button>
              <button class="redo-button" disabled>
                <builder-icon name="redo" size="20"></builder-icon>
                <span>${this.i18n.t("builder.canvas.actions.redo")}</span>
              </button>
            `
                : this.currentView === "preview"
                ? `
              <button class="device-button active" data-device="desktop">
                <builder-icon name="desktop" size="20"></builder-icon>
              </button>
              <button class="device-button" data-device="tablet">
                <builder-icon name="tablet" size="20"></builder-icon>
              </button>
              <button class="device-button" data-device="mobile">
                <builder-icon name="mobile" size="20"></builder-icon>
              </button>
            `
                : this.currentView === "html"
                ? `
              <button class="copy-button" data-type="html">
                <builder-icon name="copy" size="20"></builder-icon>
                <span>${this.i18n.t("builder.canvas.actions.copyHtml")}</span>
              </button>
              <button class="download-button" data-type="html">
                <builder-icon name="download" size="20"></builder-icon>
                <span>${this.i18n.t(
                  "builder.canvas.actions.downloadHtml"
                )}</span>
              </button>
            `
                : `
              <button class="copy-button" data-type="json">
                <builder-icon name="copy" size="20"></builder-icon>
                <span>${this.i18n.t("builder.canvas.actions.copyJson")}</span>
              </button>
            `
            }
          </div>
        </div>

        <div class="view-content">
          <div class="view design-view ${
            this.currentView === "design" ? "active" : ""
          }">
            <builder-canvas pageId="${pageId || ""}"></builder-canvas>
          </div>

          <div class="view preview-view ${
            this.currentView === "preview" ? "active" : ""
          }">
            <div class="preview-frame desktop">
              <div class="preview-content"></div>
            </div>
          </div>

          <div class="view code-view html-view ${
            this.currentView === "html" ? "active" : ""
          }">
            <pre class="html-content"></pre>
          </div>

          <div class="view code-view json-view ${
            this.currentView === "json" ? "active" : ""
          }">
            <pre class="json-content"></pre>
          </div>
        </div>
      </div>
    `;
  }

  updateActiveView() {
    // Actualizar clases de las pestañas
    this.shadowRoot.querySelectorAll(".view-tab").forEach((tab) => {
      if (tab.dataset.view === this.currentView) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Actualizar visibilidad de las vistas
    this.shadowRoot.querySelectorAll(".view").forEach((view) => {
      if (view.classList.contains(`${this.currentView}-view`)) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Re-configurar el DOM para actualizar los botones
    this.setupInitialDOM();
    this.connectCanvas();

    // Actualizar contenido si es necesario
    if (this.currentView !== "design") {
      this.updateViews();
    }

    // Re-configurar event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Configurar tabs
    this.shadowRoot.querySelectorAll(".view-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.currentView = tab.dataset.view;
        this.updateActiveView();
      });
    });

    // Configurar botones según la vista
    if (this.currentView === "design") {
      const undoButton = this.shadowRoot.querySelector(".undo-button");
      const redoButton = this.shadowRoot.querySelector(".redo-button");

      if (undoButton) {
        undoButton.addEventListener("click", this.handleUndo.bind(this));
      }
      if (redoButton) {
        redoButton.addEventListener("click", this.handleRedo.bind(this));
      }
    } else if (this.currentView === "preview") {
      this.shadowRoot.querySelectorAll(".device-button").forEach((button) => {
        button.addEventListener("click", () => {
          this.shadowRoot.querySelectorAll(".device-button").forEach((btn) => {
            btn.classList.remove("active");
          });
          button.classList.add("active");
          const previewFrame = this.shadowRoot.querySelector(".preview-frame");
          previewFrame.className = "preview-frame " + button.dataset.device;
        });
      });
    } else if (this.currentView === "html" || this.currentView === "json") {
      const copyButton = this.shadowRoot.querySelector(".copy-button");
      const downloadButton = this.shadowRoot.querySelector(".download-button");

      if (copyButton) {
        copyButton.addEventListener("click", () => {
          const content =
            this.currentView === "html"
              ? this.generateHTML()
              : JSON.stringify(this.editorData || {}, null, 2);
          navigator.clipboard.writeText(content).then(() => {
            this.showNotification(
              this.i18n.t("builder.canvas.confirmations.copySuccess")
            );
          });
        });
      }

      if (downloadButton && this.currentView === "html") {
        downloadButton.addEventListener("click", () => {
          const html = this.generateHTML();
          ExportUtils.downloadHTML(html);
          this.showNotification(
            this.i18n.t("builder.canvas.confirmations.downloadStart")
          );
        });
      }
    }

    // Siempre escuchar cambios en el historial para actualizar undo/redo
    window.builderEvents.addEventListener(
      "historyChange",
      this.handleHistoryChange
    );
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;

    this.shadowRoot.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  generatePreviewHTML(data) {
    if (!data || !data.rows) return "";

    const globalStyles = data.globalSettings || {};
    const wrapperStyles = `
      max-width: ${globalStyles.maxWidth || "1200px"};
      padding: ${globalStyles.padding || "20px"};
      background-color: ${globalStyles.backgroundColor || "#ffffff"};
      font-family: ${
        globalStyles.fontFamily || "system-ui, -apple-system, sans-serif"
      };
      margin: 0 auto;
    `;

    return `
      <div class="page-wrapper" style="${wrapperStyles}">
        ${data.rows
          .map((row) => {
            const columns = row.columns
              .map((column) => {
                const elements = column.elements
                  .map((element) => {
                    const styleString = Object.entries(element.styles || {})
                      .map(([key, value]) => {
                        const cssKey = key
                          .replace(/([A-Z])/g, "-$1")
                          .toLowerCase();
                        return `${cssKey}: ${value}`;
                      })
                      .join("; ");

                    switch (element.type) {
                      case "text":
                        return `<div style="${styleString}">${
                          element.content || ""
                        }</div>`;
                      case "heading":
                        const tag = element.tag || "h2";
                        return `<${tag} style="${styleString}">${
                          element.content || ""
                        }</${tag}>`;
                      case "image":
                        const imgAttrs = Object.entries(
                          element.attributes || {}
                        )
                          .map(([key, value]) => `${key}="${value}"`)
                          .join(" ");
                        return `<img ${imgAttrs} style="${styleString}">`;
                      case "button":
                        const href = element.attributes?.href
                          ? `onclick="window.open('${element.attributes.href}', '_blank')"`
                          : "";
                        return `<button ${href} style="${styleString}">${
                          element.content || ""
                        }</button>`;
                      case "divider":
                        return `<hr style="${styleString}">`;
                      case "html":
                        return element.content || "";
                      case "video":
                        const videoAttrs = Object.entries(
                          element.attributes || {}
                        )
                          .map(([key, value]) => `${key}="${value}"`)
                          .join(" ");
                        return `<div class="video-container" style="${styleString}">
                <iframe ${videoAttrs}></iframe>
              </div>`;
                      case "spacer":
                        return `<div style="${styleString}"></div>`;
                      case "list":
                        const items = element.content
                          .split("\n")
                          .map((item) => `<li>${item.trim()}</li>`)
                          .join("");
                        return `<${element.tag} style="${styleString}">${items}</${element.tag}>`;
                      case "table":
                        return `<div class="table-container" style="overflow-x: auto;">
                <table style="${styleString}">${element.content}</table>
              </div>`;
                      default:
                        return `<div style="${styleString}">${
                          element.content || ""
                        }</div>`;
                    }
                  })
                  .join("\n");

                return `<div class="column" style="flex: 1; padding: 10px;">${elements}</div>`;
              })
              .join("\n");

            return `<div class="row" style="display: flex; margin: 0 auto; max-width: 1200px;">${columns}</div>`;
          })
          .join("\n")}
      </div>
      `;
  }
  contentChangedListener(event) {
    console.log(
      "🔄 ViewSwitcher - Content changed event received",
      event.detail
    );

    // Asegurarse de que los globalSettings se incluyan en editorData
    this.editorData = {
      ...event.detail,
      globalSettings: event.detail.globalSettings || {},
    };

    // Actualizar todas las vistas
    this.updateViews();

    // Si no estamos en una operación undo/redo, actualizar el historial
    if (!this._isUndoRedoOperation) {
      console.log(
        "🔄 ViewSwitcher - Pushing new state to history:",
        this.editorData
      );
      this.history.pushState(this.editorData);
    }
  }

  updateViews() {
    console.log("🔄 ViewSwitcher - Updating views with data:", this.editorData);

    if (!this.editorData) return;

    const htmlContent = this.shadowRoot.querySelector(".html-content");
    const jsonContent = this.shadowRoot.querySelector(".json-content");
    const previewContent = this.shadowRoot.querySelector(".preview-content");

    if (htmlContent) {
      const html = this.generateHTML();
      htmlContent.textContent = html;
      console.log("🔄 ViewSwitcher - Updated HTML view");
    }

    if (jsonContent) {
      jsonContent.textContent = JSON.stringify(this.editorData || {}, null, 2);
      console.log("🔄 ViewSwitcher - Updated JSON view");
    }

    if (previewContent) {
      previewContent.innerHTML = this.generatePreviewHTML(this.editorData);
      console.log("🔄 ViewSwitcher - Updated preview");
    }
  }

  generateHTML() {
    if (!this.editorData) {
      return "<!-- No content -->";
    }

    const globalStyles = this.editorData.globalSettings || {};

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Page</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: ${
          globalStyles.fontFamily || "system-ui, -apple-system, sans-serif"
        };
        line-height: 1.5;
        color: #333;
        background-color: #f5f5f5;
      }
      
      .page-wrapper {
        max-width: ${globalStyles.maxWidth || "1200px"};
        padding: ${globalStyles.padding || "20px"};
        background-color: ${globalStyles.backgroundColor || "#ffffff"};
        margin: 0 auto;
      }
      
      img {
        max-width: 100%;
        height: auto;
      }
      
      .row {
        display: flex;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
      }
      
      .column {
        flex: 1;
        padding: 1rem;
      }
      
      @media (max-width: 768px) {
        .row {
          flex-direction: column;
        }
      }
    </style>
</head>
<body>
    ${
      this.editorData
        ? this.convertToHTML(this.editorData)
        : "<!-- No content -->"
    }
</body>
</html>`;

    return ExportUtils.generateExportableHTML(this.editorData);
  }

  // En canvas-view-switcher.js
  convertToHTML(data) {
    if (!data || !data.rows) return "";

    return data.rows
      .map((row) => {
        const columns = row.columns
          .map((column) => {
            const elements = column.elements
              .map((element) => {
                const styleString = Object.entries(element.styles || {})
                  .map(([key, value]) => {
                    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                    return `${cssKey}: ${value}`;
                  })
                  .join("; ");

                switch (element.type) {
                  case "text":
                    return `<div style="${styleString}">${
                      element.content || ""
                    }</div>`;

                  case "heading":
                    const tag = element.tag || "h2";
                    return `<${tag} style="${styleString}">${
                      element.content || ""
                    }</${tag}>`;

                  case "image":
                    const imgAttrs = Object.entries(element.attributes || {})
                      .map(([key, value]) => `${key}="${value}"`)
                      .join(" ");
                    return `<img ${imgAttrs} style="${styleString}">`;

                  case "button":
                    return `<button style="${styleString}">${
                      element.content || ""
                    }</button>`;

                  case "divider":
                    return `<hr style="${styleString}">`;

                  case "html":
                    return element.content || "";

                  default:
                    return `<div style="${styleString}">${
                      element.content || ""
                    }</div>`;
                }
              })
              .join("\n");

            return `<div class="column" style="flex: 1; padding: 10px;">${elements}</div>`;
          })
          .join("\n");

        return `<div class="row" style="display: flex; margin: 0 auto; max-width: 1200px;">${columns}</div>`;
      })
      .join("\n");
  }
}

customElements.define("canvas-view-switcher", CanvasViewSwitcher);
export { CanvasViewSwitcher };
