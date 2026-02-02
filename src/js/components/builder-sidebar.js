// builder-sidebar.js
import { BuilderIcon } from "./builder-icon.js";
import { I18n } from "../utils/i18n.js";
import { registerEditors } from "./register-editors.js";
import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { ROW_LAYOUTS } from "../utils/responsive-config.js";

export class BuilderSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    registerEditors();
    this.currentTab = "principal";
    this.showingEditor = false;
    this.selectedElement = null;
    this.i18n = I18n.getInstance();

    // Define available rows from responsive layouts
    this.rows = ROW_LAYOUTS.map((layout) => ({
      type: `row-${layout.desktop}`,
      desktop: layout.desktop,
      mobile: layout.mobile,
    }));

    this.elements = [
      { type: "heading" },
      { type: "text" },
      { type: "image" },
      { type: "button" },
      { type: "link" },
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
    eventBus.off("rowSelected", this.rowSelectedHandler);
    eventBus.off("rowDeselected", this.rowDeselectedHandler);
    eventBus.off("elementSelected", this.elementSelectedHandler);
    eventBus.off("elementDeselected", this.elementDeselectedHandler);

    // Create handlers
    this.rowSelectedHandler = (data) => {
      this.selectedRow = data.row;
      this.showingRowEditor = true;
      this.showingEditor = false;
      this.selectedElement = null;
      this.render();
    };

    this.rowDeselectedHandler = () => {
      this.selectedRow = null;
      this.showingRowEditor = false;
      this.render();
    };

    this.elementSelectedHandler = (data) => {
      
      this.selectedElement = data;
      this.showingEditor = true;
      this.showingRowEditor = false;
      this.selectedRow = null;
      
      
      this.render();
    };

    this.elementDeselectedHandler = () => {
      this.selectedElement = null;
      this.showingEditor = false;
      this.render();
    };

    // Add event listeners
    eventBus.on("rowSelected", this.rowSelectedHandler);
    eventBus.on("rowDeselected", this.rowDeselectedHandler);
    eventBus.on("elementSelected", this.elementSelectedHandler);
    eventBus.on("elementDeselected", this.elementDeselectedHandler);
  }

  handleStateChange(newState, prevState) {
    // Check if relevant state has changed
    const needsUpdate =
      newState.selectedRow !== prevState?.selectedRow ||
      newState.selectedElement !== prevState?.selectedElement ||
      newState.dragging !== prevState?.dragging ||
      JSON.stringify(newState.rows) !== JSON.stringify(prevState?.rows);

    if (needsUpdate) {
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
            <builder-icon name="back" size="20"></builder-icon>
            <span>${this.i18n.t("builder.sidebar.back") || "Regresar"}</span>
          </button>
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
    // Group rows by mobile column count
    const groups = [
      { mobile: 1, label: this.i18n.t("builder.sidebar.rows.group1col") || "1 col mobile" },
      { mobile: 2, label: this.i18n.t("builder.sidebar.rows.group2col") || "2 cols mobile" },
      { mobile: 3, label: this.i18n.t("builder.sidebar.rows.group3col") || "3 cols mobile" },
    ];

    return `
      <div class="tab-content">
        ${groups
          .map((group) => {
            const groupRows = this.rows.filter((r) => r.mobile === group.mobile);
            if (groupRows.length === 0) return "";
            return `
              <div class="row-group">
                <div class="row-group-label">${group.label}</div>
                <div class="elements-container">
                  ${groupRows
                    .map(
                      (row) => `
                      <div class="builder-element" data-type="${row.type}" data-desktop="${row.desktop}" data-mobile="${row.mobile}">
                        <div class="element-icon">
                          <builder-icon name="${row.type}" size="24"></builder-icon>
                        </div>
                        <div class="element-label">${row.desktop} → ${row.mobile}</div>
                      </div>
                    `
                    )
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
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

    // Configurar event listeners y suscripciones - now handled in setupEventSubscriptions

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


  disconnectedCallback() {
    // Clean up subscriptions
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
    
    // Clean up event listeners with handlers
    eventBus.off("rowSelected", this.rowSelectedHandler);
    eventBus.off("rowDeselected", this.rowDeselectedHandler);
    eventBus.off("elementSelected", this.elementSelectedHandler);
    eventBus.off("elementDeselected", this.elementDeselectedHandler);
    eventBus.off("globalSettingsUpdated", this.globalSettingsUpdateHandler);
    
    // Clean up drag and drop handlers
    // WeakMap se limpia automáticamente cuando los elementos se eliminan del DOM
    this._elementHandlers = null;
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
    // Limpiar handlers existentes
    if (this._elementHandlers && this._elementHandlers instanceof WeakMap) {
      // WeakMap no tiene forEach, usar un approach diferente
      // Los WeakMaps se limpian automáticamente cuando los elementos se eliminan
    }
    
    // Siempre inicializar/reinicializar el WeakMap
    this._elementHandlers = new WeakMap();

    // Configurar nuevos eventos
    this.shadowRoot.querySelectorAll(".builder-element").forEach((element) => {
      element.draggable = true;

      const dragStartHandler = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (element.dataset.type.startsWith("row-")) {
          e.dataTransfer.setData("text/plain", element.dataset.type);
          e.dataTransfer.setData("application/x-builder-element", element.dataset.type);
          // Include responsive config if available
          if (element.dataset.desktop && element.dataset.mobile) {
            e.dataTransfer.setData(
              "application/x-responsive",
              JSON.stringify({
                desktop: parseInt(element.dataset.desktop, 10),
                mobile: parseInt(element.dataset.mobile, 10),
              })
            );
          }
        } else {
          e.dataTransfer.setData(
            "application/x-builder-element",
            element.dataset.type
          );
        }

        element.classList.add("dragging");
      };

      const dragEndHandler = () => {
        element.classList.remove("dragging");
      };

      // Guardar handlers para limpieza posterior
      this._elementHandlers.set(element, {
        dragstart: dragStartHandler,
        dragend: dragEndHandler
      });

      element.addEventListener("dragstart", dragStartHandler);
      element.addEventListener("dragend", dragEndHandler);
    });
  }

  // Método para configurar los event listeners del tab principal
  // En builder-sidebar.js, modificar setupPrincipalTabListeners
  setupPrincipalTabListeners() {

    const maxWidthInput = this.shadowRoot.getElementById("maxWidthInput");

    if (maxWidthInput) {
      maxWidthInput.addEventListener("input", (e) => {
        eventBus.emit("globalSettingsUpdated", {
          settings: {
            maxWidth: `${e.target.value}px`,
          },
        });
      });
    }

    // Padding
    const paddingInput = this.shadowRoot.getElementById("paddingInput");
    if (paddingInput) {
      paddingInput.addEventListener("input", (e) => {
        eventBus.emit("globalSettingsUpdated", {
          settings: {
            padding: `${e.target.value}px`,
          },
        });
      });
    }

    // Color de fondo
    const backgroundColorInput = this.shadowRoot.getElementById(
      "backgroundColorInput"
    );
    if (backgroundColorInput) {
      backgroundColorInput.addEventListener("input", (e) => {
        eventBus.emit("globalSettingsUpdated", {
          settings: {
            backgroundColor: e.target.value,
          },
        });
      });
    }

    // Fuente
    const fontFamilySelect = this.shadowRoot.getElementById("fontFamilySelect");
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener("change", (e) => {
        eventBus.emit("globalSettingsUpdated", {
          settings: {
            fontFamily: e.target.value,
          },
        });
      });
    }
  }

  render() {
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
            <builder-icon name="back" size="20"></builder-icon>
            <span>${this.i18n.t("builder.sidebar.back") || "Regresar"}</span>
          </button>
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
      rowEditor.setRow(this.selectedRow);
    }

    if (backButton) {
      backButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.showingRowEditor = false;
        this.selectedRow = null;
        eventBus.emit("rowDeselected");
        this.render();
      };
    }
  }

  handleRowUpdated(event) {
    const { rowId, styles, columns } = event.detail;

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

      .row-group {
        margin-bottom: 1.5rem;
      }

      .row-group-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
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
        padding: 0.65rem 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        gap: 0.5rem;
      }

      .back-button {
        padding: 0.25rem 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #666;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      .back-button:hover {
        color: #2196F3;
        background: rgba(33, 150, 243, 0.08);
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
