class CanvasViewSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentView = "design";
    this.editorData = null;
    this.canvas = null; // Mantener referencia al canvas
  }

  connectedCallback() {
    this.setupInitialDOM();
    this.setupEventListeners();
  }

  setupInitialDOM() {
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
  
          /* Estilo para el botón de copiar */
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
        </style>
  
        <div class="view-container">
          <div class="view-tabs">
            <button class="view-tab" data-view="design">Design</button>
            <button class="view-tab" data-view="html">HTML</button>
            <button class="view-tab" data-view="json">JSON</button>
          </div>
  
          <div class="view-content">
            <div class="view design-view">
              <builder-canvas></builder-canvas>
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

    // Event listener para el canvas
    this.canvas.addEventListener("contentChanged", (e) => {
      this.editorData = e.detail;
      this.updateViews();
    });

    // Event listeners para los botones de copiar
    this.shadowRoot.querySelectorAll(".copy-button").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.dataset.type;
        const content =
          type === "html"
            ? this.generateHTML()
            : JSON.stringify(this.editorData, null, 2);
        navigator.clipboard.writeText(content).then(() => {
          const originalText = button.textContent;
          button.textContent = "Copied!";
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        });
      });
    });
  }

  updateViews() {
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

                // Manejar diferentes tipos de elementos
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

        return `
        <div class="row" style="display: flex; margin: 0 auto; max-width: 1200px;">
          ${columns}
        </div>`;
      })
      .join("\n");
  }
}

customElements.define("canvas-view-switcher", CanvasViewSwitcher);
export { CanvasViewSwitcher };
