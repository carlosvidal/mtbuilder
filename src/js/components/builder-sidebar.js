import { BuilderIcon } from "./builder-icon.js";

class BuilderSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentTab = "principal";
    this.showingEditor = false;
    this.selectedElement = null;

    this.rows = [
      {
        type: "row-1",
        label: "1 Columna",
        columns: 1,
      },
      {
        type: "row-2",
        label: "2 Columnas",
        columns: 2,
      },
      {
        type: "row-3",
        label: "3 Columnas",
        columns: 3,
      },
      {
        type: "row-4",
        label: "4 Columnas",
        columns: 4,
      },
    ];

    this.elements = [
      {
        type: "heading",
        label: "Encabezado",
      },
      {
        type: "text",
        label: "Texto",
      },
      {
        type: "image",
        label: "Imagen",
      },
      {
        type: "button",
        label: "Botón",
      },
      {
        type: "table",
        label: "Tabla",
      },
      {
        type: "list",
        label: "Lista",
      },
      {
        type: "video",
        label: "Video",
      },
      {
        type: "divider",
        label: "Divisor",
      },
      {
        type: "spacer",
        label: "Espacio",
      },
      {
        type: "html",
        label: "HTML",
      },
    ];
  }

  connectedCallback() {
    this.setupElementSelection();
    this.render();
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

  renderMainSidebar() {
    return `
      <div class="tabs">
        <button class="tab ${
          this.currentTab === "principal" ? "active" : ""
        }" data-tab="principal">
          Principal
        </button>
        <button class="tab ${
          this.currentTab === "rows" ? "active" : ""
        }" data-tab="rows">
          Filas
        </button>
        <button class="tab ${
          this.currentTab === "elements" ? "active" : ""
        }" data-tab="elements">
          Elementos
        </button>
      </div>
      ${
        this.currentTab === "principal"
          ? this.renderPrincipalTab()
          : this.currentTab === "rows"
          ? this.renderRowsTab()
          : this.renderElementsTab()
      }
    `;
  }

  renderPrincipalTab() {
    return `
      <div class="tab-content">
        <div class="form-group">
          <label>Ancho máximo</label>
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
          <label>Padding</label>
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
          <label>Color de fondo</label>
          <input 
            type="color" 
            id="backgroundColorInput"
            value="${
              this.getCanvasGlobalSettings().backgroundColor || "#ffffff"
            }"
          />
        </div>
        
        <div class="form-group">
          <label>Fuente principal</label>
          <select id="fontFamilySelect">
            <option value="system-ui, -apple-system, sans-serif" ${
              this.getCanvasGlobalSettings().fontFamily.includes("system-ui")
                ? "selected"
                : ""
            }>System UI</option>
            <option value="Arial, sans-serif" ${
              this.getCanvasGlobalSettings().fontFamily.includes("Arial")
                ? "selected"
                : ""
            }>Arial</option>
            <option value="Helvetica, sans-serif" ${
              this.getCanvasGlobalSettings().fontFamily.includes("Helvetica")
                ? "selected"
                : ""
            }>Helvetica</option>
            <option value="Georgia, serif" ${
              this.getCanvasGlobalSettings().fontFamily.includes("Georgia")
                ? "selected"
                : ""
            }>Georgia</option>
          </select>
        </div>
      </div>
    `;
  }

  // Método para configurar los event listeners del tab principal
  setupPrincipalTabListeners() {
    const canvas = document.querySelector("builder-canvas");
    if (!canvas) return;

    // Ancho máximo
    const maxWidthInput = this.shadowRoot.getElementById("maxWidthInput");
    maxWidthInput?.addEventListener("change", (e) => {
      canvas.updateGlobalSettings({
        maxWidth: `${e.target.value}px`,
      });
    });

    // Padding
    const paddingInput = this.shadowRoot.getElementById("paddingInput");
    paddingInput?.addEventListener("change", (e) => {
      canvas.updateGlobalSettings({
        padding: `${e.target.value}px`,
      });
    });

    // Color de fondo
    const backgroundColorInput = this.shadowRoot.getElementById(
      "backgroundColorInput"
    );
    backgroundColorInput?.addEventListener("input", (e) => {
      canvas.updateGlobalSettings({
        backgroundColor: e.target.value,
      });
    });

    // Fuente principal
    const fontFamilySelect = this.shadowRoot.getElementById("fontFamilySelect");
    fontFamilySelect?.addEventListener("change", (e) => {
      canvas.updateGlobalSettings({
        fontFamily: e.target.value,
      });
    });
  }

  renderRowsTab() {
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
              <div class="element-label">${row.label}</div>
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
              <div class="element-label">${element.label}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <div class="sidebar-container">
        ${
          this.showingEditor
            ? `
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
        `
            : this.renderMainSidebar()
        }
      </div>
    `;

    if (this.showingEditor) {
      requestAnimationFrame(() => {
        const editor = this.shadowRoot.querySelector("element-editor");
        const backButton = this.shadowRoot.getElementById("backButton");

        if (editor && this.selectedElement) {
          // Asegurarse de que el elemento personalizado esté definido antes de usarlo
          if (customElements.get("element-editor")) {
            editor.setElement(this.selectedElement);
          } else {
            console.error("element-editor custom element is not defined");
          }
        }

        if (backButton) {
          backButton.addEventListener("click", () => {
            this.showingEditor = false;
            this.selectedElement = null;
            this.render();
            this.setupTabListeners();
            this.setupDragAndDrop();
          });
        }
      });
    } else {
      this.setupTabListeners();
      this.setupDragAndDrop();
    }
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
          padding: 1.5rem;
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
