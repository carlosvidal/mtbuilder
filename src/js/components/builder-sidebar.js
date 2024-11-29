import { BuilderIcon } from "./builder-icon.js";
import { I18n } from "../utils/i18n.js";
import { registerEditors } from "./register-editors.js";

class BuilderSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    registerEditors();
    this.currentTab = "principal";
    this.showingEditor = false;
    this.selectedElement = null;
    this.i18n = I18n.getInstance();

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

    // Listen for language changes
    window.addEventListener("localeChanged", () => {
      this.render();
    });

    this.showingRowEditor = false;
    this.selectedRow = null;
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
    console.log("🏁 Sidebar - Connected"); // Nuevo log
    this.setupElementSelection();

    // Forzar la configuración de los listeners si estamos en la pestaña principal
    if (this.currentTab === "principal") {
      console.log("🏁 Sidebar - Principal tab active, setting up listeners"); // Nuevo log
      requestAnimationFrame(() => {
        this.setupPrincipalTabListeners();
      });
    }

    this.render();
    this.setupRowSelection();
  }

  setupRowSelection() {
    window.builderEvents.addEventListener("rowSelected", (e) => {
      console.log("Row selected:", e.detail);
      this.selectedRow = e.detail;
      this.showingRowEditor = true;
      this.showingEditor = false; // Asegurar que el editor de elementos se oculte
      this.selectedElement = null;
      this.render();
    });

    window.builderEvents.addEventListener("rowDeselected", () => {
      this.selectedRow = null;
      this.showingRowEditor = false;
      this.render();
    });
  }

  disconnectedCallback() {
    window.builderEvents.removeEventListener(
      "elementSelected",
      this.selectionListener
    );
    window.builderEvents.removeEventListener(
      "elementDeselected",
      this.deselectionListener
    );
  }

  setupElementSelection() {
    this.selectionListener = (e) => {
      this.selectedElement = e.detail;
      this.showingEditor = true;
      this.showingRowEditor = false; // Asegurar que el editor de filas se oculte
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
    this.shadowRoot.querySelectorAll(".builder-element").forEach((element) => {
      element.setAttribute("draggable", "true");

      element.addEventListener("dragstart", (e) => {
        const type = element.getAttribute("data-type");
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/builder-element", type);
        e.dataTransfer.setData("text/plain", type);
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
      rowEditor.setRow(this.selectedRow);
    }

    if (backButton) {
      backButton.onclick = () => {
        this.showingRowEditor = false;
        this.selectedRow = null;
        window.builderEvents.dispatchEvent(new CustomEvent("rowDeselected"));
        this.render();
      };
    }
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

        .section-header {
          padding: 0 1rem;
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
                    
        @keyframes tilt-n-move-shaking {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(5px, 5px) rotate(5deg); }
          50% { transform: translate(0, 0) rotate(0eg); }
          75% { transform: translate(-5px, 5px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
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
  
        .builder-element:hover {
          border-color: #2196F3;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          animation: tilt-n-move-shaking 0.25s infinite;
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
  
        .form-group {
          margin-bottom: 1.5rem;
        }
  
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
        }
  
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
        }
  
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2196F3;
        }
        
        .editor-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .editor-header {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #ddd;
          background: #f5f5f5;
          gap: 0.5rem;
          height: 48px;
          margin-bottom: 1rem;
        }
        
        .back-button {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #666;
          padding: 0.5rem;
          border-radius: 4px;
          margin-right: 0.25rem;
        }
        
        .back-button:hover {
          background: #eee;
          color: #333;
        }
        
        .editor-title {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
          font-weight: normal;
        }
        
        .editor-content {
          flex: 1;
          overflow-y: auto;
        }

        element-editor {
          display: block;
          height: 100%;
        }

        .input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .input-group input[type="number"] {
      flex: 1;
      width: auto;
    }

    .input-addon {
      color: #666;
      font-size: 0.875rem;
      padding: 0.5rem 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
      font-size: 0.875rem;
    }

    input[type="color"] {
      -webkit-appearance: none;
      padding: 0;
      width: 100%;
      height: 40px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 4px;
    }

    input[type="color"]::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }

    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #333;
      background-color: white;
    }

    select:focus {
      outline: none;
      border-color: #2196F3;
    }

    .tab-content {
      padding: 1.5rem;
    }
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
export { BuilderSidebar };
