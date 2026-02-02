import { BuilderIcon } from "./builder-icon.js";
import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { History } from "../utils/history.js";
import { ExportUtils } from "../utils/export-utils.js";
import { sanitizeHTML } from "../utils/sanitize.js";
import { I18n } from "../utils/i18n.js";

class CanvasViewSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentView = "design";
    this.history = new History();
    this._isUndoRedoOperation = false;
    this.i18n = I18n.getInstance();

    // Suscribirse al store y eventos
    this.unsubscribeStore = store.subscribe(this.handleStateChange.bind(this));
    this.setupEventSubscriptions();
  }

  setupEventSubscriptions() {
    eventBus.on("contentChanged", this.handleContentChanged.bind(this));
    eventBus.on("historyChange", this.handleHistoryChange.bind(this));
  }

  handleContentChanged(data) {
    if (!this._isUndoRedoOperation) {
      this.history.pushState(data);
    }
  }

  handleStateChange(newState, prevState) {
    // Solo actualizar las vistas si hay cambios relevantes
    const hasChanges =
      JSON.stringify(prevState?.rows) !== JSON.stringify(newState?.rows) ||
      JSON.stringify(prevState?.globalSettings) !==
        JSON.stringify(newState?.globalSettings);

    if (hasChanges && this.currentView !== "design") {
      this.updateViews(newState);
    }
  }

  static get observedAttributes() {
    return ["pageId"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue !== oldValue) {
      const switcher = this.shadowRoot.querySelector("canvas-view-switcher");
      if (switcher) {
        switcher.setAttribute("pageId", newValue);
      }
    }
  }

  connectedCallback() {
    this.setupInitialDOM();
    this.setupEventListeners();
    this.updateActiveView();
  }

  disconnectedCallback() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }

    eventBus.off("contentChanged", this.handleContentChanged);
    eventBus.off("historyChange", this.handleHistoryChange);
    eventBus.off("viewChanged", this.handleViewChange);
  }

  handleHistoryChange({ canUndo, canRedo }) {
    // Solo actualizar si estamos en vista diseño
    if (this.currentView === "design") {
      const undoButton = this.shadowRoot.querySelector(".undo-button");
      const redoButton = this.shadowRoot.querySelector(".redo-button");

      if (undoButton) undoButton.disabled = !canUndo;
      if (redoButton) redoButton.disabled = !canRedo;
    }
  }

  async handleUndo() {
    const previousState = this.history.undo();
    if (previousState) {
      this._isUndoRedoOperation = true;
      store.setState(previousState);
      this._isUndoRedoOperation = false;
    }
  }

  async handleRedo() {
    const nextState = this.history.redo();
    if (nextState) {
      this._isUndoRedoOperation = true;
      store.setState(nextState);
      this._isUndoRedoOperation = false;
    }
  }

  handleViewChange(newView) {
    if (this.currentView === newView) return;

    this.currentView = newView;
    this.updateActiveView();

    // Emitir evento de cambio de vista
    eventBus.emit("viewChanged", { view: newView });

    // Actualizar las vistas si no estamos en diseño
    if (this.currentView !== "design") {
      this.updateViews();
    }
  }

  updateActiveView() {
    // Actualizar clases de las pestañas
    this.shadowRoot.querySelectorAll(".view-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.view === this.currentView);
    });

    // Actualizar visibilidad de las vistas
    this.shadowRoot.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle(
        "active",
        view.classList.contains(`${this.currentView}-view`)
      );
    });

    // Actualizar los botones de acción según la vista actual
    this.updateActionButtons();

    // Actualizar contenido si no estamos en la vista de diseño
    if (this.currentView !== "design") {
      this.updateViews();
    }
  }

  updateActionButtons() {
    const actionsContainer = this.shadowRoot.querySelector(".view-actions");
    if (!actionsContainer) return;

    // Generar HTML para los botones según la vista actual
    let buttonsHtml = "";
    switch (this.currentView) {
      case "design":
        buttonsHtml = `
          <button class="undo-button" disabled>
            <builder-icon name="undo" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.undo")}</span>
          </button>
          <button class="redo-button" disabled>
            <builder-icon name="redo" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.redo")}</span>
          </button>
          <button class="save-button">
            <builder-icon name="save" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.save")}</span>
          </button>
        `;
        break;
      case "preview":
        buttonsHtml = `
          <button class="device-button active" data-device="desktop">
            <builder-icon name="desktop" size="20"></builder-icon>
          </button>
          <button class="device-button" data-device="tablet">
            <builder-icon name="tablet" size="20"></builder-icon>
          </button>
          <button class="device-button" data-device="mobile">
            <builder-icon name="mobile" size="20"></builder-icon>
          </button>
        `;
        break;
      case "html":
        buttonsHtml = `
          <button class="copy-button" data-type="html">
            <builder-icon name="copy" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.copyHtml")}</span>
          </button>
          <button class="download-button" data-type="html">
            <builder-icon name="download" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.downloadHtml")}</span>
          </button>
        `;
        break;
      case "json":
        buttonsHtml = `
          <button class="copy-button" data-type="json">
            <builder-icon name="copy" size="20"></builder-icon>
            <span>${this.i18n.t("builder.canvas.actions.copyJson")}</span>
          </button>
        `;
        break;
    }

    actionsContainer.innerHTML = buttonsHtml;
    this.setupActionListeners();
  }

  setupEventListeners() {
    // Configurar tabs
    this.shadowRoot.querySelectorAll(".view-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.handleViewChange(tab.dataset.view);
      });
    });

    this.setupActionListeners();
  }

  setupActionListeners() {
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
      const saveButton = this.shadowRoot.querySelector(".save-button");
      if (saveButton) {
        saveButton.addEventListener("click", () => {
          eventBus.emit("saveRequested");
        });
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
          const state = store.getState();
          const content =
            this.currentView === "html"
              ? ExportUtils.generateHTML(state)
              : JSON.stringify(state, null, 2);

          navigator.clipboard.writeText(content).then(() => {
            this.showNotification(
              this.i18n.t("builder.canvas.confirmations.copySuccess")
            );
          });
        });
      }

      if (downloadButton && this.currentView === "html") {
        downloadButton.addEventListener("click", () => {
          const state = store.getState();
          const html = ExportUtils.generateHTML(state);
          ExportUtils.downloadHTML(html);
          this.showNotification(
            this.i18n.t("builder.canvas.confirmations.downloadStart")
          );
        });
      }
    }
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

  updateViews() {
    const state = store.getState();
    const data = {
      rows: state.rows.map((row) => ({
        ...row,
        styles: row.styles || {}, // Asegurar que los estilos estén presentes
        columns: row.columns.map((column) => ({
          ...column,
          elements: column.elements.map((element) => ({
            ...element,
            styles: element.styles || {},
          })),
        })),
      })),
      globalSettings: state.globalSettings || {},
    };

    switch (this.currentView) {
      case "html":
        this.updateHtmlView(data);
        break;
      case "preview":
        this.updatePreviewView(data);
        break;
      case "json":
        this.updateJsonView(data);
        break;
    }
  }

  updateHtmlView(data) {
    const htmlContent = this.shadowRoot.querySelector(".html-content");
    if (htmlContent) {
      htmlContent.textContent = ExportUtils.generateHTML(data);
    }
  }

  updatePreviewView(data) {
    const previewContent = this.shadowRoot.querySelector(".preview-content");
    if (previewContent) {
      previewContent.innerHTML = sanitizeHTML(ExportUtils.generatePreviewHTML(data));
    }
  }

  updateJsonView(data) {
    const jsonContent = this.shadowRoot.querySelector(".json-content");
    if (jsonContent) {
      jsonContent.textContent = JSON.stringify(data, null, 2);
    }
  }

  setupInitialDOM() {
    const pageId = this.getAttribute("pageId");
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

        .view-actions .save-button {
          background: #4CAF50;
          color: white;
          padding: 0.5rem 1rem;
        }

        .view-actions .save-button:hover {
          background: #388E3C;
          color: white;
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
            <!-- Los botones se agregarán dinámicamente en updateActionButtons -->
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

    // Actualizar los botones de acción iniciales
    this.updateActionButtons();
  }
}

customElements.define("canvas-view-switcher", CanvasViewSwitcher);
export { CanvasViewSwitcher };
