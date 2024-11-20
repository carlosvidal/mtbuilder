// page-manager.js
import { CanvasStorage } from "./canvas-storage.js";

export class PageManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentPageId = null;
  }

  connectedCallback() {
    this.loadPages();
    this.render();
  }

  loadPages() {
    try {
      const pagesData = localStorage.getItem("pageBuilderPages");
      console.log("Loaded pages data:", pagesData);
      this.pages = pagesData ? JSON.parse(pagesData) : [];
      console.log("Parsed pages:", this.pages);
    } catch (error) {
      console.error("Error loading pages:", error);
      this.pages = [];
    }
  }

  loadBuilder(pageId) {
    this.currentPageId = pageId; // Asegurarse de establecer el currentPageId

    requestAnimationFrame(() => {
      const builder = this.shadowRoot.querySelector("page-builder");
      if (!builder) return;

      // Obtener los datos de la página
      const pageData = this.pages.find((p) => p.id === pageId);
      if (pageData?.data) {
        // Guardar en CanvasStorage antes de configurar el canvas
        CanvasStorage.saveCanvas(pageId, pageData.data);
      }

      // Configurar el listener para cambios una sola vez
      if (!this._changeListener) {
        this._changeListener = (e) => {
          this.savePage({
            id: this.currentPageId,
            data: e.detail,
            name: this.pages.find((p) => p.id === this.currentPageId)?.name,
          });
        };
        builder.addEventListener("contentChanged", this._changeListener);
      }
    });
  }

  savePage(pageData) {
    const existingPageIndex = this.pages.findIndex((p) => p.id === pageData.id);

    const page = {
      id: pageData.id || `page-${Date.now()}`,
      name:
        pageData.name ||
        (existingPageIndex >= 0
          ? this.pages[existingPageIndex].name
          : `Página sin título ${this.pages.length + 1}`),
      lastModified: new Date().toISOString(),
      data: pageData.data || { rows: [] },
    };

    if (existingPageIndex >= 0) {
      this.pages[existingPageIndex] = page;
    } else {
      this.pages.push(page);
    }

    // Guardar en ambos almacenamientos
    localStorage.setItem("pageBuilderPages", JSON.stringify(this.pages));
    CanvasStorage.saveCanvas(page.id, page.data);

    console.log("Saved page:", page);
    console.log("Current pages:", this.pages);
  }

  deletePage(pageId) {
    this.pages = this.pages.filter((p) => p.id !== pageId);
    localStorage.setItem("pageBuilderPages", JSON.stringify(this.pages));
    CanvasStorage.clearCanvas(pageId); // Limpiar también el canvas storage
    this.render();
  }

  render() {
    const isEditing = this.currentPageId !== null;

    if (isEditing) {
      this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              height: 100vh;
            }
  
            .header {
              display: flex;
              align-items: center;
              padding: 1rem;
              background: #f8f9fa;
              border-bottom: 1px solid #dee2e6;
            }
  
            .back-button {
              padding: 0.5rem 1rem;
              background: none;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 1rem;
            }
  
            .page-title {
              margin: 0;
              font-size: 1.25rem;
              color: #333;
            }
  
            .builder-container {
              height: calc(100% - 60px);
            }
          </style>
  
          <div class="header">
            <button class="back-button" id="backToList">← Volver</button>
            <h1 class="page-title">
              ${
                this.pages.find((p) => p.id === this.currentPageId)?.name ||
                "Editor"
              }
            </h1>
          </div>
          <div class="builder-container">
            <page-builder></page-builder>
          </div>
        `;

      const backButton = this.shadowRoot.getElementById("backToList");
      const builder = this.shadowRoot.querySelector("page-builder");

      // Esperar a que el builder esté listo y configurarlo una sola vez
      requestAnimationFrame(() => {
        const canvas = builder?.shadowRoot.querySelector("builder-canvas");
        if (canvas) {
          const pageData = this.pages.find((p) => p.id === this.currentPageId);
          if (pageData?.data) {
            // Primero guardar los datos en el storage
            CanvasStorage.saveCanvas(this.currentPageId, pageData.data);
            // Luego configurar el canvas
            canvas.setPageId(this.currentPageId);
          }
        }
      });

      backButton.addEventListener("click", () => {
        this.currentPageId = null;
        this.render();
      });

      // Configurar el listener para cambios
      builder.addEventListener("contentChanged", (e) => {
        this.savePage({
          id: this.currentPageId,
          data: e.detail,
          name: this.pages.find((p) => p.id === this.currentPageId)?.name,
        });
      });
    } else {
      this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              padding: 2rem;
            }
  
            .pages-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2rem;
            }
  
            .new-page-button {
              padding: 0.75rem 1.5rem;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
  
            .pages-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 1.5rem;
            }
  
            .page-card {
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 1.5rem;
              background: white;
            }
  
            .page-card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 1rem;
            }
  
            .page-name {
              margin: 0;
              font-size: 1.25rem;
              color: #333;
            }
  
            .page-actions {
              display: flex;
              gap: 0.5rem;
            }
  
            .page-action-button {
              padding: 0.25rem;
              background: none;
              border: none;
              cursor: pointer;
              color: #666;
            }
  
            .page-action-button:hover {
              color: #333;
            }
  
            .page-meta {
              color: #666;
              font-size: 0.875rem;
            }
  
            .empty-state {
              text-align: center;
              padding: 3rem;
              background: #f8f9fa;
              border-radius: 8px;
              color: #666;
            }
          </style>
  
          <div class="pages-header">
            <h1>Mis Páginas</h1>
            <button class="new-page-button" id="newPage">
              Crear Nueva Página
            </button>
          </div>
  
          ${
            this.pages.length === 0
              ? `
            <div class="empty-state">
              <h2>No hay páginas creadas</h2>
              <p>Comienza creando tu primera página</p>
            </div>
          `
              : `
            <div class="pages-grid">
              ${this.pages
                .map(
                  (page) => `
                <div class="page-card">
                  <div class="page-card-header">
                    <h2 class="page-name">${page.name}</h2>
                    <div class="page-actions">
                      <button class="page-action-button" data-action="edit" data-page-id="${
                        page.id
                      }">
                        ✏️
                      </button>
                      <button class="page-action-button" data-action="delete" data-page-id="${
                        page.id
                      }">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div class="page-meta">
                    Última modificación: ${new Date(
                      page.lastModified
                    ).toLocaleString()}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
          }
        `;

      // Event Listeners
      const newPageButton = this.shadowRoot.getElementById("newPage");

      newPageButton.addEventListener("click", () => {
        const pageId = `page-${Date.now()}`;

        // Limpiar el canvas existente para la nueva página
        CanvasStorage.clearCanvas(pageId);

        this.savePage({
          id: pageId,
          name: `Nueva Página ${this.pages.length + 1}`,
          data: { rows: [] },
        });

        this.currentPageId = pageId;
        this.render();
      });

      this.shadowRoot
        .querySelectorAll(".page-action-button")
        .forEach((button) => {
          button.addEventListener("click", (e) => {
            const action = button.dataset.action;
            const pageId = button.dataset.pageId;

            // En page-manager.js, simplificar el manejo de edición
            if (action === "edit") {
              const pageData = this.pages.find((p) => p.id === pageId);
              console.log("Editing page:", pageId, pageData);

              if (pageData) {
                // Primero cambiamos al modo edición
                this.currentPageId = pageId;
                this.render();

                // Después del render, configuramos el canvas
                requestAnimationFrame(() => {
                  console.log("Setting up canvas after render");
                  const builder = this.shadowRoot.querySelector("page-builder");
                  const canvas =
                    builder?.shadowRoot.querySelector("builder-canvas");

                  if (canvas) {
                    console.log("Found canvas, setting data");
                    // Establecer el pageId primero
                    canvas.pageId = pageId;

                    // Esperar un frame para asegurarnos de que el pageId se estableció
                    requestAnimationFrame(() => {
                      // Si los datos no se cargaron automáticamente, establecerlos manualmente
                      if (canvas.rows.length === 0 && pageData.data?.rows) {
                        console.log(
                          "Setting rows manually:",
                          pageData.data.rows
                        );
                        canvas.rows = pageData.data.rows;
                        canvas.render();
                      }
                    });
                  }
                });
              }
            } else if (action === "delete") {
              if (
                confirm("¿Estás seguro de que deseas eliminar esta página?")
              ) {
                // Al eliminar, también limpiamos el canvas storage
                CanvasStorage.clearCanvas(pageId);
                this.deletePage(pageId);
              }
            }
          });
        });
    }
  }
}

customElements.define("page-manager", PageManager);
