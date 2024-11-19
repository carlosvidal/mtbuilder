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
        icon: "▭",
        label: "1 Columna",
        columns: 1,
      },
      {
        type: "row-2",
        icon: "⫼",
        label: "2 Columnas",
        columns: 2,
      },
      {
        type: "row-3",
        icon: "☰",
        label: "3 Columnas",
        columns: 3,
      },
      {
        type: "row-4",
        icon: "❘❘❘❘",
        label: "4 Columnas",
        columns: 4,
      },
      {
        type: "row-6",
        icon: "❘❘❘❘❘❘",
        label: "6 Columnas",
        columns: 6,
      },
    ];

    this.elements = [
      {
        type: "heading",
        icon: "H",
        label: "Encabezado",
      },
      {
        type: "text",
        icon: "T",
        label: "Texto",
      },
      {
        type: "image",
        icon: "🖼️",
        label: "Imagen",
      },
      {
        type: "button",
        icon: "▭",
        label: "Botón",
      },
      {
        type: "divider",
        icon: "―",
        label: "Divisor",
      },
      {
        type: "html",
        icon: "</>",
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

  renderPrincipalTab() {
    return `
      <div class="tab-content">
        <div class="form-group">
          <label>Ancho máximo</label>
          <input type="text" value="1200px" />
        </div>
        <div class="form-group">
          <label>Padding</label>
          <input type="text" value="20px" />
        </div>
        <div class="form-group">
          <label>Color de fondo</label>
          <input type="color" value="#ffffff" />
        </div>
        <div class="form-group">
          <label>Fuente principal</label>
          <select>
            <option>System UI</option>
            <option>Arial</option>
            <option>Helvetica</option>
          </select>
        </div>
      </div>
    `;
  }

  renderRowsTab() {
    return `
      <div class="tab-content">
        <div class="elements-container">
          ${this.rows
            .map(
              (row) => `
            <div class="builder-element" data-type="${row.type}">
              <div class="element-icon">${row.icon}</div>
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
              <div class="element-icon">${element.icon}</div>
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
      <style>
        :host {
          display: block;
          height: 100%;
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
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
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #ddd;
          background: #f5f5f5;
          gap: 0.5rem;
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
          height: 32px;
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
      </style>

      <div class="sidebar-container">
        ${
          this.showingEditor
            ? `
          <div class="editor-container">
            <div class="editor-header">
              <button class="back-button" id="backButton">
                <span>←</span>
                <span>Back</span>
              </button>
              <h3 class="editor-title">Edit ${
                this.selectedElement?.type || "Element"
              }</h3>
            </div>
            <div class="editor-content">
              <element-editor id="elementEditor"></element-editor>
            </div>
          </div>
        `
            : `
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
        `
        }
      </div>
    `;

    if (this.showingEditor) {
      requestAnimationFrame(() => {
        const editor = this.shadowRoot.getElementById("elementEditor");
        const backButton = this.shadowRoot.getElementById("backButton");

        if (editor && this.selectedElement) {
          editor.setElement(this.selectedElement);
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
