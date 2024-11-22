import { History } from "./history.js";

class CanvasViewSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentView = "design";
    this.editorData = null;
    this.canvas = null; // Mantener referencia al canvas
    this.history = new History();
    this._isUndoRedoOperation = false;
    window.builderEvents = window.builderEvents || new EventTarget();

    // Bind methods
    this.handleHistoryChange = this.handleHistoryChange.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleRedo = this.handleRedo.bind(this);

    // Almacenar referencia al listener
    this.contentChangedListener = (event) => {
      this.editorData = event.detail;
      if (!this._isUndoRedoOperation) {
        this.history.pushState(this.editorData);
      }
      this.updateViews();
    };
  }

  static get observedAttributes() {
    return ["pageId"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue !== oldValue) {
      console.log("CanvasViewSwitcher: pageId changed to", newValue);
      const canvas = this.shadowRoot.querySelector("builder-canvas");
      if (canvas) {
        canvas.setAttribute("pageId", newValue);
      }
    }
  }

  connectedCallback() {
    this.setupInitialDOM();
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
    console.log("History change received:", { canUndo, canRedo });

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
    const previousState = this.history.undo();
    if (previousState && this.canvas) {
      this._isUndoRedoOperation = true;
      this.canvas._isUndoRedoOperation = true; // Importante: también actualizar el estado en el canvas

      try {
        this.editorData = previousState;
        this.canvas.setEditorData(previousState, true); // Pasar suppressEvent como true
        this.updateViews();
      } finally {
        this._isUndoRedoOperation = false;
        this.canvas._isUndoRedoOperation = false;
      }
    }
  }

  handleRedo() {
    console.log("Redo button clicked");
    const nextState = this.history.redo();
    console.log("Next state:", nextState);

    if (nextState && this.canvas) {
      this._isUndoRedoOperation = true;
      this.canvas._isUndoRedoOperation = true; // Importante: también actualizar el estado en el canvas

      try {
        this.editorData = nextState;
        this.canvas.setEditorData(nextState, true); // Pasar suppressEvent como true
        this.updateViews();
      } finally {
        this._isUndoRedoOperation = false;
        this.canvas._isUndoRedoOperation = false;
      }
    }
  }

  setupInitialDOM() {
    const pageId = this.getAttribute("pageId");
    console.log("CanvasViewSwitcher: Setting up DOM with pageId:", pageId);

    // Crear la estructura base del DOM
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            height: 100%;
            background: #fff;
          }
  
          .view-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
  
          .view-tabs {
            display: flex;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            text-align: center;
            font-size: 0.875rem;
            font-weight: normal;
          }
  
          .view-tab {
            padding: 1rem 2rem;
            cursor: pointer;
            border: none;
            background: none;
            position: relative;
            color: #666;
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
            overflow: auto;
          }
  
          .view.active {
            display: block;
          }
  
          .code-view {
            padding: 1rem;
            background: #f8f9fa;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.5;
            height: 100%;
            box-sizing: border-box;
          }
  
          .design-view {
            height: 100%;
          }
  
          builder-canvas {
            height: 100%;
            display: block;
          }
  
          .copy-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
  
          .copy-button:hover {
            background: #1976D2;
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

          .view-actions {
            display: flex;
            gap: 0.5rem;
            padding: 0 1rem;
          }

           .undo-button,
    .redo-button {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .undo-button.active,
    .redo-button.active {
      opacity: 1;
      cursor: pointer;
    }

          .undo-button,
.redo-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.undo-button:not(:disabled):hover,
.redo-button:not(:disabled):hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.undo-button:disabled,
.redo-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.undo-button:disabled:hover,
.redo-button:disabled:hover {
  background: none;
  color: #666;
}

.button-icon {
  font-size: 1.2em;
  line-height: 1;
}

.undo-button:not(:disabled),
.redo-button:not(:disabled) {
  color: #2196F3;
}

.undo-button:not(:disabled):hover,
.redo-button:not(:disabled):hover {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
}
        </style>
  
        <div class="view-container">
          <div class="view-header">
            <div class="view-tabs">
              <button class="view-tab active" data-view="design">Design</button>
              <button class="view-tab" data-view="html">HTML</button>
              <button class="view-tab" data-view="json">JSON</button>
            </div>
            <div class="view-actions">
              <button class="undo-button" disabled>
                <span class="button-icon">↶</span>
                Deshacer
              </button>
              <button class="redo-button" disabled>
                <span class="button-icon">↷</span>
                Rehacer
              </button>
            </div>
          </div>
  
          <div class="view-content">
            <div class="view design-view active">
              <builder-canvas pageId="${pageId || ""}"></builder-canvas>
            </div>
  
            <div class="view html-view code-view">
              <button class="copy-button" data-type="html">Copy HTML</button>
              <pre class="html-content"></pre>
            </div>
  
            <div class="view json-view code-view">
              <button class="copy-button" data-type="json">Copy JSON</button>
              <pre class="json-content"></pre>
            </div>
          </div>
        </div>
      `;

    // Guardar referencia al canvas
    this.canvas = this.shadowRoot.querySelector("builder-canvas");

    // Activar la vista inicial
    this.updateActiveView();
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

    // Actualizar contenido si es necesario
    if (this.currentView !== "design") {
      this.updateViews();
    }
  }

  setupEventListeners() {
    // Event listeners para las pestañas
    this.shadowRoot.querySelectorAll(".view-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.currentView = tab.dataset.view;
        this.updateActiveView();
      });
    });

    // Event listeners para undo/redo
    const undoButton = this.shadowRoot.querySelector(".undo-button");
    const redoButton = this.shadowRoot.querySelector(".redo-button");

    if (undoButton) {
      undoButton.addEventListener("click", () => {
        console.log("Undo button clicked");
        this.handleUndo();
      });
    }

    if (redoButton) {
      redoButton.addEventListener("click", () => {
        console.log("Redo button clicked");
        this.handleRedo();
      });
    }

    // Escuchar cambios en el canvas
    if (this.canvas) {
      this.canvas.addEventListener("contentChanged", (event) => {
        console.log("Content changed event received");
        this.editorData = event.detail;

        // Solo guardar en el historial si no estamos en una operación undo/redo
        if (!this._isUndoRedoOperation && !this.canvas._isUndoRedoOperation) {
          console.log("Pushing new state to history");
          this.history.pushState(this.editorData);
        }

        this.updateViews();
      });
    }

    // Escuchar cambios en el historial
    window.builderEvents.addEventListener(
      "historyChange",
      this.handleHistoryChange.bind(this)
    );
  }

  updateViews() {
    if (!this.editorData) return;

    const htmlContent = this.shadowRoot.querySelector(".html-content");
    const jsonContent = this.shadowRoot.querySelector(".json-content");

    if (htmlContent) {
      htmlContent.textContent = this.generateHTML();
    }

    if (jsonContent) {
      jsonContent.textContent = JSON.stringify(this.editorData || {}, null, 2);
    }
  }

  generateHTML() {
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
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.5;
        color: #333;
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
