// builder-sidebar.js
import { BuilderIcon } from "./builder-icon.js";
import { I18n } from "../utils/i18n.js";
import { registerEditors } from "./register-editors.js";
import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";

export class BuilderSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    registerEditors();
    this.currentTab = "principal";
    this.showingEditor = false;
    this.selectedElement = null;
    this.i18n = I18n.getInstance();

    // Define available rows and elements
    this.rows = [
      { type: "row-1", columns: 1 },
      { type: "row-2", columns: 2 },
      { type: "row-3", columns: 3 },
      { type: "row-4", columns: 4 },
    ];

    this.elements = [
      { type: "heading" },
      { type: "text" },
      { type: "image" },
      { type: "button" },
      { type: "table" },
      { type: "list" },
      { type: "video" },
      { type: "divider" },
      { type: "spacer" },
      { type: "html" },
    ];

    // Subscribe to store changes
    this.unsubscribeStore = store.subscribe(this.handleStateChange.bind(this));

    // Subscribe to events
    this.setupEventSubscriptions();

    this.showingRowEditor = false;
    this.selectedRow = null;
  }

  setupEventSubscriptions() {
    // Remove old event listeners
    window.builderEvents.removeEventListener(
      "rowSelected",
      this.rowSelectedHandler
    );
    window.builderEvents.removeEventListener(
      "rowDeselected",
      this.rowDeselectedHandler
    );
    window.builderEvents.removeEventListener(
      "elementSelected",
      this.elementSelectedHandler
    );
    window.builderEvents.removeEventListener(
      "elementDeselected",
      this.elementDeselectedHandler
    );

    // Create handlers
    this.rowSelectedHandler = (e) => {
      console.log("Row selected event received:", e.detail);
      this.selectedRow = e.detail.row;
      this.showingRowEditor = true;
      this.showingEditor = false;
      this.selectedElement = null;
      this.render();
    };

    this.rowDeselectedHandler = () => {
      console.log("Row deselected event received");
      this.selectedRow = null;
      this.showingRowEditor = false;
      this.render();
    };

    this.elementSelectedHandler = (e) => {
      console.log("Element selected event received:", e.detail);
      this.selectedElement = e.detail;
      this.showingEditor = true;
      this.showingRowEditor = false;
      this.selectedRow = null;
      this.render();
    };

    this.elementDeselectedHandler = () => {
      console.log("Element deselected event received");
      this.selectedElement = null;
      this.showingEditor = false;
      this.render();
    };

    // Add new event listeners
    window.builderEvents.addEventListener(
      "rowSelected",
      this.rowSelectedHandler
    );
    window.builderEvents.addEventListener(
      "rowDeselected",
      this.rowDeselectedHandler
    );
    window.builderEvents.addEventListener(
      "elementSelected",
      this.elementSelectedHandler
    );
    window.builderEvents.addEventListener(
      "elementDeselected",
      this.elementDeselectedHandler
    );
  }

  handleStateChange(newState, prevState) {
    console.log("Sidebar state change:", {
      prev: prevState,
      next: newState,
    });

    // Check if relevant state has changed
    const needsUpdate =
      newState.selectedRow !== prevState?.selectedRow ||
      newState.selectedElement !== prevState?.selectedElement ||
      newState.dragging !== prevState?.dragging ||
      JSON.stringify(newState.rows) !== JSON.stringify(prevState?.rows);

    if (needsUpdate) {
      console.log("Sidebar needs update, rendering...");
      this.render();

      // Setup drag and drop after render if needed
      if (this.currentTab === "rows" || this.currentTab === "elements") {
        requestAnimationFrame(() => {
          this.setupDragAndDrop();
        });
      }
    }
  }

  renderMainSidebar() {
    return `
      <div class="tabs">
        <button class="tab ${
          this.currentTab === "principal" ? "active" : ""
        }" data-tab="principal">
          ${this.i18n.t("builder.sidebar.tabs.settings")}
        </button>
        <button class="tab ${
          this.currentTab === "rows" ? "active" : ""
        }" data-tab="rows">
          ${this.i18n.t("builder.sidebar.tabs.rows")}
        </button>
        <button class="tab ${
          this.currentTab === "elements" ? "active" : ""
        }" data-tab="elements">
          ${this.i18n.t("builder.sidebar.tabs.elements")}
        </button>
      </div>
      ${
        this.showingRowEditor
          ? this.renderRowEditor()
          : this.currentTab === "principal"
          ? this.renderPrincipalTab()
          : this.currentTab === "rows"
          ? this.renderRowsTab()
          : this.renderElementsTab()
      }
    `;
  }

  renderRowEditor() {
    return `
      <div class="editor-container">
        <div class="editor-header">
          <button class="back-button" id="backButton">
            <builder-icon name="back" size="24"></builder-icon>
            <span>Back</span>
          </button>
          <h3 class="editor-title">Editar Fila</h3>
        </div>
        <div class="editor-content">
          <row-editor id="rowEditor"></row-editor>
        </div>
      </div>
    `;
  }

  renderPrincipalTab() {
    return `
    <div class="principal-tab">
      <div class="section-header">
        <h2>${this.i18n.t("builder.sidebar.principal.title")}</h2>
        <p class="description">${this.i18n.t(
          "builder.sidebar.principal.description"
        )}</p>
      </div>
      <div class="tab-content">
        <div class="form-group">
          <label>${this.i18n.t("builder.settings.page.maxWidth")}</label>
          <div class="input-group">
            <input 
              type="number" 
              id="maxWidthInput"
              min="320" 
              max="2400" 
              step="10"
              value="${
                parseInt(this.getCanvasGlobalSettings().maxWidth) || 1200
              }"
            />
            <span class="input-addon">px</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>${this.i18n.t("builder.editor.common.styles.spacing")}</label>
          <div class="input-group">
            <input 
              type="number" 
              id="paddingInput"
              min="0" 
              max="100" 
              value="${parseInt(this.getCanvasGlobalSettings().padding) || 20}"
            />
            <span class="input-addon">px</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>${this.i18n.t("builder.settings.page.background")}</label>
          <input 
            type="color" 
            id="backgroundColorInput"
            value="${
              this.getCanvasGlobalSettings().backgroundColor || "#ffffff"
            }"
          />
        </div>
        
        <div class="form-group">
          <label>${this.i18n.t("builder.settings.page.font")}</label>
          <select id="fontFamilySelect">
            <option value="system-ui, -apple-system, sans-serif">System UI</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
          </select>
        </div>
      </div>
    `;
  }

  renderRowsTab() {
    const getColumnKey = (columns) => {
      switch (columns) {
        case 1:
          return "oneColumn";
        case 2:
          return "twoColumns";
        case 3:
          return "threeColumns";
        case 4:
          return "fourColumns";
        default:
          return "oneColumn";
      }
    };

    return `
      <div class="tab-content">
        <div class="elements-container">
          ${this.rows
            .map(
              (row) => `
              <div class="builder-element" data-type="${row.type}">
                <div class="element-icon">
                  <builder-icon name="${row.type}" size="24"></builder-icon>
                </div>
                <div class="element-label">${this.i18n.t(
                  `builder.sidebar.rows.${getColumnKey(row.columns)}`
                )}</div>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderElementsTab() {
    return `
      <div class="tab-content">
        <div class="elements-container">
          ${this.elements
            .map(
              (element) => `
            <div class="builder-element" data-type="${element.type}">
              <div class="element-icon">
                <builder-icon name="${element.type}" size="24"></builder-icon>
              </div>
              <div class="element-label">${this.i18n.t(
                `builder.sidebar.elements.${element.type}`
              )}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  connectedCallback() {
    console.log("🏁 Sidebar - Connected");

    // Configurar event listeners y suscripciones
    this.setupRowSelection();
    this.setupElementSelection();

    // Renderizar inicialmente
    this.render();

    // Configurar listeners después del render
    requestAnimationFrame(() => {
      this.setupTabListeners();
      this.setupDragAndDrop();

      if (this.currentTab === "principal") {
        this.setupPrincipalTabListeners();
      }
    });
  }

  setupRowSelection() {
    // Limpiar suscripciones anteriores
    eventBus.off("rowSelected");
    eventBus.off("rowDeselected");

    // Suscribirse a nuevos eventos
    eventBus.on("rowSelected", ({ row }) => {
      console.log("Row selected:", row);
      this.selectedRow = row;
      this.showingRowEditor = true;
      this.showingEditor = false;
      this.selectedElement = null;
      this.render();
    });

    eventBus.on("rowDeselected", () => {
      console.log("Row deselected");
      this.selectedRow = null;
      this.showingRowEditor = false;
      this.render();
    });
  }

  disconnectedCallback() {
    // Clean up subscriptions
    this.unsubscribeStore();
    eventBus.off("rowSelected");
    eventBus.off("rowDeselected");
    eventBus.off("elementSelected");
    eventBus.off("elementDeselected");
  }

  setupElementSelection() {
    this.selectionListener = (e) => {
      this.selectedElement = e.detail;
      this.showingEditor = true;
      this.showingRowEditor = false;
      this.selectedRow = null;
      this.render();
    };

    this.deselectionListener = () => {
      this.selectedElement = null;
      this.showingEditor = false;
      this.render();
    };

    window.builderEvents.addEventListener(
      "elementSelected",
      this.selectionListener
    );
    window.builderEvents.addEventListener(
      "elementDeselected",
      this.deselectionListener
    );
  }

  setupTabListeners() {
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.currentTab = tab.dataset.tab;
        this.render();

        // Si el tab actual es "principal", configurar sus listeners
        if (this.currentTab === "principal") {
          this.setupPrincipalTabListeners();
        }
      });
    });
  }

  setupDragAndDrop() {
    console.log("🎨 Sidebar - Setting up drag and drop");

    // Setup row dragging
    this.shadowRoot
      .querySelectorAll('.builder-element[data-type^="row-"]')
      .forEach((element) => {
        console.log("🎨 Setting up row element:", element.dataset.type);

        element.setAttribute("draggable", "true");
        element.addEventListener("dragstart", (e) => {
          console.log("🎨 Row dragstart:", {
            type: element.dataset.type,
          });

          e.dataTransfer.setData("text/plain", element.dataset.type);
          e.dataTransfer.effectAllowed = "copy";

          element.classList.add("dragging");
        });

        element.addEventListener("dragend", () => {
          element.classList.remove("dragging");
        });
      });

    // Setup element dragging
    this.shadowRoot
      .querySelectorAll('.builder-element:not([data-type^="row-"])')
      .forEach((element) => {
        element.setAttribute("draggable", "true");

        element.addEventListener("dragstart", (e) => {
          console.log("🎨 Element dragstart:", element.dataset.type);

          e.dataTransfer.setData(
            "application/x-builder-element",
            element.dataset.type
          );
          e.dataTransfer.setData("text/plain", element.dataset.type);
          e.dataTransfer.effectAllowed = "copy";

          element.classList.add("dragging");
        });

        element.addEventListener("dragend", () => {
          element.classList.remove("dragging");
        });
      });
  }

  // Método para configurar los event listeners del tab principal
  // En builder-sidebar.js, modificar setupPrincipalTabListeners
  setupPrincipalTabListeners() {
    console.log("🔧 Sidebar - Setting up principal tab listeners");

    const maxWidthInput = this.shadowRoot.getElementById("maxWidthInput");
    console.log("🔧 Sidebar - maxWidthInput element:", maxWidthInput);

    if (maxWidthInput) {
      maxWidthInput.addEventListener("input", (e) => {
        console.log("📝 Sidebar - maxWidth changed:", e.target.value);
        window.builderEvents.dispatchEvent(
          new CustomEvent("globalSettingsUpdated", {
            detail: {
              settings: {
                maxWidth: `${e.target.value}px`,
              },
            },
          })
        );
      });
    }

    // Padding
    const paddingInput = this.shadowRoot.getElementById("paddingInput");
    if (paddingInput) {
      paddingInput.addEventListener("input", (e) => {
        window.builderEvents.dispatchEvent(
          new CustomEvent("globalSettingsUpdated", {
            detail: {
              settings: {
                padding: `${e.target.value}px`,
              },
            },
          })
        );
      });
    }

    // Color de fondo
    const backgroundColorInput = this.shadowRoot.getElementById(
      "backgroundColorInput"
    );
    if (backgroundColorInput) {
      backgroundColorInput.addEventListener("input", (e) => {
        window.builderEvents.dispatchEvent(
          new CustomEvent("globalSettingsUpdated", {
            detail: {
              settings: {
                backgroundColor: e.target.value,
              },
            },
          })
        );
      });
    }

    // Fuente
    const fontFamilySelect = this.shadowRoot.getElementById("fontFamilySelect");
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener("change", (e) => {
        window.builderEvents.dispatchEvent(
          new CustomEvent("globalSettingsUpdated", {
            detail: {
              settings: {
                fontFamily: e.target.value,
              },
            },
          })
        );
      });
    }
  }

  render() {
    console.log("🎨 Sidebar - Rendering", {
      showingEditor: this.showingEditor,
      showingRowEditor: this.showingRowEditor,
    });

    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <div class="sidebar-container">
        ${
          this.showingEditor && this.selectedElement
            ? this.renderElementEditor()
            : this.showingRowEditor && this.selectedRow
            ? this.renderRowEditor()
            : this.renderMainSidebar()
        }
      </div>
    `;

    requestAnimationFrame(() => {
      if (this.showingEditor && this.selectedElement) {
        this.setupElementEditor();
      } else if (this.showingRowEditor && this.selectedRow) {
        this.setupRowEditor();
      } else {
        this.setupTabListeners();
        this.setupDragAndDrop();
      }
    });
  }

  getCanvasGlobalSettings() {
    // Primero intentamos obtener el canvas que está en el mismo shadow tree
    let canvas =
      this.closest("page-builder")?.shadowRoot?.querySelector("builder-canvas");

    // Si no lo encontramos, buscamos en el documento principal
    if (!canvas) {
      canvas = document.querySelector("builder-canvas");
    }

    return (
      canvas?.globalSettings || {
        maxWidth: "1200px",
        padding: "20px",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }
    );
  }

  renderElementEditor() {
    return `
      <div class="editor-container">
        <div class="editor-header">
          <button class="back-button" id="backButton">
            <builder-icon name="back" size="24"></builder-icon>
            <span>Back</span>
          </button>
          <h3 class="editor-title">Edit ${
            this.selectedElement?.type || "Element"
          }</h3>
        </div>
        <div class="editor-content">
          <element-editor></element-editor>
        </div>
      </div>
    `;
  }

  setupRowEditor() {
    const rowEditor = this.shadowRoot.querySelector("row-editor");
    const backButton = this.shadowRoot.querySelector("#backButton");

    if (rowEditor && this.selectedRow) {
      console.log("Setting up row editor with row:", this.selectedRow);
      rowEditor.setRow(this.selectedRow);
    }

    if (backButton) {
      backButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("Closing row editor");
        this.showingRowEditor = false;
        this.selectedRow = null;
        eventBus.emit("rowDeselected");
        this.render();
      };
    }
  }

  handleRowUpdated(event) {
    const { rowId, styles, columns } = event.detail;
    console.log("Row updated:", { rowId, styles, columns });

    eventBus.emit("rowUpdated", {
      rowId,
      styles,
      columns,
    });
  }

  setupElementEditor() {
    const editor = this.shadowRoot.querySelector("element-editor");
    const backButton = this.shadowRoot.querySelector("#backButton");

    if (editor && this.selectedElement) {
      editor.setElement(this.selectedElement);
    }

    if (backButton) {
      backButton.onclick = () => {
        this.showingEditor = false;
        this.selectedElement = null;
        this.render();
        this.setupTabListeners();
        this.setupDragAndDrop();
      };
    }
  }

  getStyles() {
    return `
    <style>
      :host {
        display: block;
        height: 100%;
        background: white;
        font-family: system-ui, -apple-system, sans-serif;
      }
  
      * {
        box-sizing: border-box;
      }
  
      .sidebar-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
  
      .tabs {
        display: flex;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        align-items: stretch;
      }
  
      .tab {
        padding: 1rem;
        cursor: pointer;
        border: none;
        background: none;
        position: relative;
        color: #666;
        flex: 1;
        text-align: center;
        font-size: 0.875rem;
        font-weight: normal;
      }
  
      .tab:hover {
        color: #2196F3;
      }
  
      .tab.active {
        color: #2196F3;
        font-weight: 500;
      }
  
      .tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: #2196F3;
      }
  
      .tab-content {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
      }
  
      .elements-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 1rem;
      }
  
      .builder-element {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        cursor: move;
        user-select: none;
        transition: all 0.2s ease;
      }
  
      .builder-element[draggable=true]:hover {
        border-color: #2196F3;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
  
      .builder-element[draggable=true]:active {
        transform: translateY(0);
        box-shadow: none;
      }
  
.builder-element.dragging {
  opacity: 0.5;
  border: 2px dashed #2196F3;
  background: rgba(33, 150, 243, 0.1);
}

.builder-element[draggable=true] {
  cursor: grab;
}

.builder-element[draggable=true]:active {
  cursor: grabbing;
}
  
      .element-icon {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: #333;
      }
  
      .element-label {
        font-size: 0.875rem;
        text-align: center;
        color: #666;
      }
  
      /* Styles for drag feedback */
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
  
      .builder-element[draggable=true]:active {
        animation: pulse 0.3s ease-in-out infinite;
      }
  
      /* Editor container styles */
      .editor-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
  
      .editor-header {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
  
      .back-button {
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
      }
  
      .back-button:hover {
        color: #2196F3;
      }
  
      .editor-title {
        margin: 0 0 0 1rem;
        font-size: 1rem;
        font-weight: normal;
        color: #333;
      }
  
      .editor-content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

        .section-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.section-header .description {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #666;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.input-group .input-addon {
  color: #666;
  font-size: 0.875rem;
}

input[type="color"] {
  width: 100%;
  height: 40px;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}
Last edited hace 3 minutos
        </style>  
    `;
  }

  static get observedAttributes() {
    return ["selected-element"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "selected-element" && oldValue !== newValue) {
      this.render();
    }
  }
}

customElements.define("builder-sidebar", BuilderSidebar);
